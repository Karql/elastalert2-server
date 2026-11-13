import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { config } from '../../shared/config/config.service';
import type { AppEnv } from '../../shared/http/app-env';
import { json } from '../../shared/http/openapi';
import RouteLogger from '../../shared/logger/route-logger';
import { packageInfo } from '../../shared/package-info';
import { InfoResponse } from './info.schemas';

const logger = new RouteLogger('/');

const index = createRoute({
  method: 'get',
  path: '/',
  tags: ['default'],
  operationId: 'Index',
  responses: {
    200: json(InfoResponse, 'Server info'),
  },
});

export const infoRoutes = new OpenAPIHono<AppEnv>()
  .openapi(index, (c) => {
    logger.sendSuccessful();

    return c.json({
      name: config.get().appName,
      port: config.get().port,
      version: packageInfo.version,
    }, 200);
  });
