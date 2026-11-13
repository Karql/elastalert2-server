import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../../shared/http/app-env';
import { bodyErrorResponses, errorResponses, json } from '../../shared/http/openapi';
import { getClient } from './elasticsearch.client';
import { IndexParams } from './elasticsearch.schemas';

const postSearch = createRoute({
  method: 'post',
  path: '/{index}',
  tags: ['search'],
  operationId: 'PostSearch',
  request: {
    params: IndexParams,
    body: { required: false, content: { 'application/json': { schema: z.any() } } },
  },
  responses: {
    200: json(z.any(), 'Elasticsearch search response (Elasticsearch errors are also returned as 200)'),
    ...bodyErrorResponses,
    ...errorResponses,
  },
});

export const searchRoutes = new OpenAPIHono<AppEnv>()
  .openapi(postSearch, async (c) => {
    const { index } = c.req.valid('param');
    const body = c.req.header('content-type') ? c.req.valid('json') : undefined;

    try {
      return c.json(await getClient().search({ index, body }), 200);
    } catch (error) {
      return c.json(error as any, 200); // Error also returned as 200
    }
  });
