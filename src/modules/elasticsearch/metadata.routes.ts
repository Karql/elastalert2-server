import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { config } from '../../shared/config/config.service';
import type { AppEnv } from '../../shared/http/app-env';
import { errorResponses, json } from '../../shared/http/openapi';
import { getClient } from './elasticsearch.client';
import { MetadataParams, MetadataQuery, MetadataType } from './elasticsearch.schemas';

function escapeLuceneSyntax(str: string) {
  return str.replace(/[\/+\-&|!(){}\[\]^"~*?:\\]/g, '\\$&');
}

function getQueryString(type: MetadataType, rule_name?: string) {
  if (type === 'elastalert_error') {
    return '*:*';
  }

  return `rule_name:"${rule_name ? escapeLuceneSyntax(rule_name) : '*'}"`;
}

const getMetadata = createRoute({
  method: 'get',
  path: '/{type}',
  tags: ['metadata'],
  operationId: 'GetMetadata',
  request: {
    params: MetadataParams,
    query: MetadataQuery,
  },
  responses: {
    200: json(z.any(), 'Hits from the writeback index (Elasticsearch errors are also returned as 200 with an "error" field)'),
    ...errorResponses,
  },
});

export const metadataRoutes = new OpenAPIHono<AppEnv>()
  .openapi(getMetadata, async (c) => {
    const { type } = c.req.valid('param');
    const { from, size, rule_name } = c.req.valid('query');

    try {
      const resp = await getClient().search({
        index: config.get().writeback_index,
        type,
        body: {
          from: from || 0,
          size: size || 100,
          query: {
            query_string: {
              query: getQueryString(type, rule_name),
            },
          },
          sort: [{ '@timestamp': { order: 'desc' } }],
        },
      });

      const hits: any = resp.hits;
      hits.hits = resp.hits.hits.map((h) => h._source);

      return c.json(hits, 200);
    } catch (error) {
      return c.json({ error }, 200); // Error also returned as 200
    }
  });
