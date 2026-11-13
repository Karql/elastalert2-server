import { OpenAPIHono } from '@hono/zod-openapi';
import { serveStatic } from '@hono/node-server/serve-static';
import { swaggerUI } from '@hono/swagger-ui';
import type { Context } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import type { AppEnv } from './app-env';
import type ElastalertServer from './elastalert_server';
import Logger from './common/logger';
import RequestError, { HttpError, PROBLEM_CONTENT_TYPE } from './common/errors/request_error';
import { ValidationError } from './common/errors/http_request_errors';
import { defaultRoutes } from './routes/default.routes';
import { mappingRoutes } from './routes/mapping.routes';
import { metadataRoutes } from './routes/metadata.routes';
import { rulesRoutes } from './routes/rules.routes';
import { searchRoutes } from './routes/search.routes';
import { statusRoutes } from './routes/status.routes';
import { templatesRoutes } from './routes/templates.routes';
import { testRoutes } from './routes/test.routes';

const npm = require('../package.json');
// Only the path helper, the package entry point loads the whole browser bundle (and touches localStorage on Node 25+)
const getAbsoluteFSPath: () => string = require('swagger-ui-dist/absolute-path.js');
const logger = new Logger('Server');

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

  app.use(cors());
  app.use(async (c, next) => {
    c.set('server', server);
    await next();
  });

  app.route('/', defaultRoutes);
  app.route('/status', statusRoutes);
  app.route('/rules', rulesRoutes);
  app.route('/templates', templatesRoutes);
  app.route('/mapping', mappingRoutes);
  app.route('/metadata', metadataRoutes);
  app.route('/search', searchRoutes);
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

    logger.error(`Request ${c.req.method} ${c.req.path} failed with error:`, err);
    return problem(c, new HttpError(500, err.message));
  });

  return app;
}
