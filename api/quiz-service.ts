import type { IncomingMessage, ServerResponse } from 'node:http';
import app from '../server.js';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const route = url.searchParams.get('__quiz_api');
  if (route) {
    if (!/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(route)) {
      res.statusCode = 404;
      return res.end();
    }
    url.pathname = `/api/${route}`;
    url.searchParams.delete('__quiz_api');
    req.url = url.pathname + url.search;
  }
  return app(req, res);
}
