import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../app-env';
import config from '../common/config';
import RouteLogger from './route_logger';
import { json } from './openapi';

const npm = require('../../package.json');

const logger = new RouteLogger('/');

const DefaultIndexResponse = z.object({
  name: z.string(),
  port: z.number(),
  version: z.string(),
}).openapi('DefaultIndexResponse');

const index = createRoute({
  method: 'get',
  path: '/',
  tags: ['default'],
  operationId: 'Index',
  responses: {
    200: json(DefaultIndexResponse, 'Server info'),
  },
});

export const defaultRoutes = new OpenAPIHono<AppEnv>()
  .openapi(index, (c) => {
    logger.sendSuccessful();

    return c.json({
      name: config.get().appName,
      port: config.get().port,
      version: npm.version,
    }, 200);
  });
