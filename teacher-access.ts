import type { SharedStore } from './shared-store';
import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const cookieName = "hetikviz_teacher";
const sessionLifetime = 8 * 60 * 60 * 1000;
const maxSessions = 128;

function rateLimit(max: number, windowMs: number) {
  let requests: number[] = [];
  return (cost = 1): RequestHandler => (_req, res, next) => {
    const now = Date.now();
    requests = requests.filter(time => time > now - windowMs);
    if (requests.length + cost > max) {
      res.set("Retry-After", String(Math.ceil((requests[0] + windowMs - now) / 1000)));
      return res.status(429).json({ success: false, error: "Túl sok kérés. Próbáld később!" });
    }
    for (let i = 0; i < cost; i++) requests.push(now);
    next();
  };
}

const digest = (value: string) => createHash("sha256").update(value).digest();

export function registerTeacherAccess(app: Express, {
  password, secure, store, sharedRequired,
}: { password?: string; secure: boolean; store: SharedStore; sharedRequired: boolean }) {
  const expectedPassword = password && password.length >= 16 ? digest(password) : null;
  const sessions = new Map<string, number>();
  const cookieOptions: import("express").CookieOptions = { httpOnly: true, sameSite: "strict", secure, path: "/api" };
  const unavailable = (res: Response) => res.status(503).json({ error: 'A tanári munkamenet tárolója nem érhető el.' });
  const safely = (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
    (req, res, next) => {
      void handler(req, res, next).catch(error => {
        console.error('Teacher session store:', error instanceof Error ? error.message : 'unknown error');
        if (!res.headersSent) unavailable(res);
      });
    };

  const limiter = (name: string, max: number) => {
    if (!store) return rateLimit(max, 60_000);
    return (cost = 1): RequestHandler => safely(async (_req, res, next) => {
      const retry = await store.take(`limit:${name}`, max, cost, 60_000);
      if (retry !== 0) {
        res.set('Retry-After', String(Math.max(1, Math.ceil(retry / 1000))));
        return res.status(429).json({ error: 'Túl sok kérés. Próbáld később!' });
      }
      next();
    });
  };
  const limitLogin = limiter('login', 10)(1);
  const limitGeneration = limiter('generation', 12);
  const limitDownload = limiter('download', 5)(1);
  const sessionKey = (token: string) => `session:${expectedPassword?.toString('hex').slice(0, 16)}:${digest(token).toString('hex')}`;
  const getToken = (req: Request) => req.headers.cookie?.match(/(?:^|;\s*)hetikviz_teacher=([a-f0-9]{64})(?:;|$)/)?.[1];
  const isTeacher = async (req: Request) => {
    const token = getToken(req);
    if (!token || !expectedPassword) return false;
    if (store) return (await store.get(sessionKey(token))) === 'active';
    return !sharedRequired && (sessions.get(token) ?? 0) > Date.now();
  };
  const noCache: RequestHandler = (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  };
  // This same-origin JSON request is required for session changes.
  const requireJson: RequestHandler = (req, res, next) => {
    if (req.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json" || req.get("Sec-Fetch-Site") === "cross-site") {
      return res.status(415).json({ error: "A művelethez az oldalról indított kérés szükséges." });
    }
    next();
  };

  app.get("/api/teacher/session", noCache, safely(async (req, res) => {
    res.json({ authenticated: await isTeacher(req) });
  }));

  app.post("/api/teacher/session", noCache, requireJson, safely(async (req, res, next) => {
    if (!expectedPassword) return res.status(503).json({ error: "A tanári belépés még nincs beállítva." });
    if (sharedRequired && !store) return unavailable(res);
    if (await isTeacher(req)) return res.json({ authenticated: true });
    limitLogin(req, res, next);
  }), safely(async (req, res) => {
    const supplied = req.body?.password;
    if (!expectedPassword || typeof supplied !== "string" || !timingSafeEqual(digest(supplied), expectedPassword)) {
      return res.status(401).json({ error: "Hibás tanári jelszó." });
    }
    const token = randomBytes(32).toString("hex");
    if (store) {
      await store.setSession(sessionKey(token), sessionLifetime);
    } else {
      const now = Date.now();
      for (const [key, expiry] of sessions) {
        if (expiry <= now) sessions.delete(key);
      }
      if (sessions.size >= maxSessions) {
        return res.status(503).json({ error: "Túl sok aktív tanári munkamenet." });
      }
      sessions.set(token, now + sessionLifetime);
    }
    res.cookie(cookieName, token, { ...cookieOptions, maxAge: sessionLifetime });
    res.json({ authenticated: true });
  }));

  app.delete("/api/teacher/session", noCache, requireJson, safely(async (req, res) => {
    const token = getToken(req);
    if (token && store) await store.remove(sessionKey(token));
    else if (token) sessions.delete(token);
    res.clearCookie(cookieName, cookieOptions);
    res.sendStatus(204);
  }));

  const requireTeacher = safely(async (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!(await isTeacher(req))) {
      return res.status(401).json({ success: false, error: "Jelentkezz be újra a tanári felületre." });
    }
    if (req.method === "POST") return requireJson(req, res, next);
    next();
  });

  return { requireTeacher, limitGeneration, limitDownload, limitPublish: limiter('publish', 10)(1) };
}
