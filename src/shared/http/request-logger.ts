import type { MiddlewareHandler } from 'hono';
import { getPinoLogger } from '../logger/logging';
import type { AppEnv } from './app-env';

export interface RequestLoggerOptions {
  /** Requests with these path prefixes are logged on `debug` level (e.g. static assets) */
  debugPathPrefixes?: string[];
}

/**
 * Logs one line per request: `GET /rules 200 3ms` with `method`, `path`, `status`, `durationMs` and `requestId` fields.
 * Responses with status 5xx are logged on `error` level, other on `info`.
 * The query string is not logged.
 */
export function requestLogger(options: RequestLoggerOptions = {}): MiddlewareHandler<AppEnv> {
  const debugPathPrefixes = options.debugPathPrefixes ?? [];

  return async (c, next) => {
    const start = performance.now();

    await next();

    const durationMs = Math.round(performance.now() - start);
    const { method, path } = c.req;
    const status = c.res.status;
    const level = status >= 500 ? 'error'
      : debugPathPrefixes.some((prefix) => path.startsWith(prefix)) ? 'debug'
      : 'info';

    getPinoLogger('ElastalertServer', 'Http')[level](
      { method, path, status, durationMs, requestId: c.get('requestId') },
      `${method} ${path} ${status} ${durationMs}ms`,
    );
  };
}
