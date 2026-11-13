import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../../shared/http/app-env';
import { bodyErrorResponses, errorResponses, json } from '../../shared/http/openapi';
import { TestRulePayload } from './test.schemas';

const testRule = createRoute({
  method: 'post',
  path: '/',
  tags: ['test'],
  operationId: 'TestRule',
  request: {
    body: { required: true, content: { 'application/json': { schema: TestRulePayload } } },
  },
  responses: {
    200: json(z.string(), 'ElastAlert test_rule output'),
    ...bodyErrorResponses,
    ...errorResponses,
  },
});

export const testRoutes = new OpenAPIHono<AppEnv>()
  .openapi(testRule, async (c) => {
    const { rule, options } = c.req.valid('json');

    return c.json(await c.get('server').testService.testRule(rule, options), 200);
  });
