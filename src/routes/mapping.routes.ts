import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../app-env';
import { getClient } from '../common/elasticsearch_client';
import { errorResponses, json, pathParam } from './openapi';

const getMapping = createRoute({
  method: 'get',
  path: '/{index}',
  tags: ['mapping'],
  operationId: 'GetMapping',
  request: {
    params: z.object({ index: pathParam('index') }),
  },
  responses: {
    200: json(z.any(), 'Elasticsearch index mapping'),
    ...errorResponses,
  },
});

export const mappingRoutes = new OpenAPIHono<AppEnv>()
  .openapi(getMapping, async (c) => {
    const { index } = c.req.valid('param');

    return c.json(await getClient().indices.getMapping({ index }), 200);
  });
