import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../app-env';
import { RuleNotFoundError } from '../common/errors/rule_request_errors';
import { bodyErrorResponses, errorResponses, json, notFoundResponse, pathParam } from './openapi';

const tags = ['rules'];
const params = z.object({ id: pathParam('id', 'my_rule') });

const RulesGetRulesResponse = z.object({
  rules: z.array(z.string()),
}).openapi('RulesGetRulesResponse');

const RulesAddRulePayload = z.object({
  yaml: z.string(),
}).strict().openapi('RulesAddRulePayload');

const RulesAddResponse = z.object({
  created: z.boolean(),
  id: z.string(),
}).openapi('RulesAddResponse');

const getRules = createRoute({
  method: 'get',
  path: '/',
  tags,
  operationId: 'GetRules',
  request: {
    query: z.object({ path: z.string().optional() }),
  },
  responses: {
    200: json(RulesGetRulesResponse, 'Rule ids'),
    ...errorResponses,
  },
});

const getRule = createRoute({
  method: 'get',
  path: '/{id}',
  tags,
  operationId: 'GetRule',
  request: { params },
  responses: {
    200: json(z.string(), 'Rule yaml'),
    ...notFoundResponse,
    ...errorResponses,
  },
});

// TODO: split to POST and PUT
const addRule = createRoute({
  method: 'post',
  path: '/{id}',
  tags,
  operationId: 'AddRule',
  request: {
    params,
    body: { required: true, content: { 'application/json': { schema: RulesAddRulePayload } } },
  },
  responses: {
    200: json(RulesAddResponse, 'Rule created or updated'),
    ...bodyErrorResponses,
    ...errorResponses,
  },
});

const deleteRule = createRoute({
  method: 'delete',
  path: '/{id}',
  tags,
  operationId: 'DeleteRule',
  request: { params },
  responses: {
    204: { description: 'Rule deleted' },
    ...notFoundResponse,
    ...errorResponses,
  },
});

export const rulesRoutes = new OpenAPIHono<AppEnv>()
  .openapi(getRules, async (c) => {
    const { path } = c.req.valid('query'); // TODO: probably not used
    const rules = await c.get('server').rulesService.getRules(path ?? '');

    return c.json(rules, 200);
  })
  .openapi(getRule, async (c) => {
    const { id } = c.req.valid('param');
    const rule = await c.get('server').rulesService.rule(id);

    return c.json(await rule.get(), 200);
  })
  .openapi(addRule, async (c) => {
    const { id } = c.req.valid('param');
    const { yaml } = c.req.valid('json');
    const rulesService = c.get('server').rulesService;

    try {
      const rule = await rulesService.rule(id);
      await rule.edit(yaml);
    } catch (error) {
      if (!(error instanceof RuleNotFoundError)) {
        throw error;
      }

      await rulesService.createRule(id, yaml);
    }

    return c.json({ created: true, id }, 200);
  })
  .openapi(deleteRule, async (c) => {
    const { id } = c.req.valid('param');
    const rule = await c.get('server').rulesService.rule(id);

    await rule.delete();

    return c.body(null, 204);
  });
