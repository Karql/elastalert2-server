import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../../shared/http/app-env';
import { errorResponses, json } from '../../shared/http/openapi';
import { getClient } from './elasticsearch.client';
import { IndexParams } from './elasticsearch.schemas';

const getMapping = createRoute({
  method: 'get',
  path: '/{index}',
  tags: ['mapping'],
  operationId: 'GetMapping',
  request: { params: IndexParams },
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
