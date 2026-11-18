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

export function registerTeacherAccess(app: Express, { password, secure }: { password?: string; secure: boolean }) {
  const expectedPassword = password && password.length >= 16 ? digest(password) : null;
  const sessions = new Map<string, number>();
  const cookieOptions: import("express").CookieOptions = { httpOnly: true, sameSite: "strict", secure, path: "/api" };
  const limitLogin = rateLimit(10, 60_000)(1);
  const limitGeneration = rateLimit(12, 60_000);
  const limitDownload = rateLimit(5, 60_000)(1);

  const getToken = (req: Request) => req.headers.cookie?.match(/(?:^|;\s*)hetikviz_teacher=([a-f0-9]{64})(?:;|$)/)?.[1];
  const isTeacher = (req: Request) => {
    const token = getToken(req);
    return token !== undefined && (sessions.get(token) ?? 0) > Date.now();
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

  app.get("/api/teacher/session", noCache, (req, res) => {
    res.json({ authenticated: isTeacher(req) });
  });

  app.post("/api/teacher/session", noCache, requireJson, (req, res, next) => {
    if (!expectedPassword) {
      return res.status(503).json({ error: "A tanári belépés még nincs beállítva." });
    }
    if (isTeacher(req)) return res.json({ authenticated: true });
    limitLogin(req, res, next);
  }, (req, res) => {
    const supplied = req.body?.password;
    if (!expectedPassword || typeof supplied !== "string" || !timingSafeEqual(digest(supplied), expectedPassword)) {
      return res.status(401).json({ error: "Hibás tanári jelszó." });
    }
    const now = Date.now();
    for (const [token, expiry] of sessions) {
      if (expiry <= now) sessions.delete(token);
    }
    if (sessions.size >= maxSessions) {
      return res.status(503).json({ error: "Túl sok aktív tanári munkamenet." });
    }
    const token = randomBytes(32).toString("hex");
    sessions.set(token, now + sessionLifetime);
    res.cookie(cookieName, token, { ...cookieOptions, maxAge: sessionLifetime });
    res.json({ authenticated: true });
  });

  app.delete("/api/teacher/session", noCache, requireJson, (req, res) => {
    const token = getToken(req);
    if (token) sessions.delete(token);
    res.clearCookie(cookieName, cookieOptions);
    res.sendStatus(204);
  });

  function requireTeacher(req: Request, res: Response, next: NextFunction) {
    res.set("Cache-Control", "no-store");
    if (!isTeacher(req)) {
      return res.status(401).json({ success: false, error: "Jelentkezz be újra a tanári felületre." });
    }
    if (req.method === "POST") return requireJson(req, res, next);
    next();
  }

  return { requireTeacher, limitGeneration, limitDownload, limitPublish: rateLimit(10, 60_000)(1) };
}
