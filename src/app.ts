import { OpenAPIHono } from '@hono/zod-openapi';
import { serveStatic } from '@hono/node-server/serve-static';
import { swaggerUI } from '@hono/swagger-ui';
import type { Context } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { requestId } from 'hono/request-id';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { infoRoutes } from './modules/info/info.routes';
import { rulesRoutes } from './modules/rules/rules.routes';
import { statusRoutes } from './modules/status/status.routes';
import { templatesRoutes } from './modules/templates/templates.routes';
import { testRoutes } from './modules/test/test.routes';
import type ElastalertServer from './server';
import RequestError, { HttpError, PROBLEM_CONTENT_TYPE } from './shared/errors/request-error';
import { ValidationError } from './shared/errors/validation-error';
import type { AppEnv } from './shared/http/app-env';
import { requestLogger } from './shared/http/request-logger';
import { getPinoLogger } from './shared/logger/logging';
import { packageInfo as npm } from './shared/package-info';

// Only the path helper, the package entry point loads the whole browser bundle (and touches localStorage on Node 25+)
const getAbsoluteFSPath: () => string = require('swagger-ui-dist/absolute-path.js');

const swaggerAssetsPath = '/swagger-ui/assets';

function problem(c: Context, error: RequestError) {
  return c.body(JSON.stringify(error.toProblem(c.req.path)), error.status as ContentfulStatusCode, {
    'Content-Type': PROBLEM_CONTENT_TYPE,
  });
}

export function createApp(server: ElastalertServer) {
  const app = new OpenAPIHono<AppEnv>({
    // Turn Zod validation failures into the same error shape as other request errors
    defaultHook: (result) => {
      if (!result.success) {
        throw new ValidationError(result.target, result.error);
      }
    },
  });

  // Uses X-Request-Id from the request when present, returns it in the response
  app.use(requestId());
  app.use(requestLogger({ debugPathPrefixes: [swaggerAssetsPath] }));
  app.use(cors());
  app.use(async (c, next) => {
    c.set('server', server);
    await next();
  });

  app.route('/', infoRoutes);
  app.route('/status', statusRoutes);
  app.route('/rules', rulesRoutes);
  app.route('/templates', templatesRoutes);
  app.route('/test', testRoutes);

  app.doc('/swagger.json', {
    openapi: '3.0.0',
    info: {
      title: npm.name,
      version: npm.version,
      description: npm.description,
      license: { name: npm.license },
    },
    servers: [{ url: '/' }],
  });

  // Swagger UI assets are served from node_modules so the UI works without internet access
  app.use(`${swaggerAssetsPath}/swagger-ui-dist/*`, serveStatic({
    root: getAbsoluteFSPath(),
    rewriteRequestPath: (path) => path.slice(`${swaggerAssetsPath}/swagger-ui-dist`.length),
  }));
  const ui = swaggerUI({ url: '/swagger.json', baseUrl: swaggerAssetsPath, title: `${npm.name} - Swagger UI` });
  app.get('/swagger-ui', ui);
  app.get('/swagger-ui/', ui);

  // All errors are returned as Problem Details (RFC 9457)
  app.notFound((c) => problem(c, new HttpError(404, `Cannot ${c.req.method} ${c.req.path}`)));

  app.onError((err, c) => {
    if (err instanceof RequestError) {
      return problem(c, err);
    }

    // Malformed JSON (400), unsupported media type (415), ...
    if (err instanceof HTTPException) {
      return problem(c, new HttpError(err.status, err.message));
    }

    getPinoLogger('ElastalertServer', 'Http').error({ err, method: c.req.method, path: c.req.path, requestId: c.get('requestId') }, 'Request failed with unexpected error');
    return problem(c, new HttpError(500, err.message));
  });

  return app;
}
