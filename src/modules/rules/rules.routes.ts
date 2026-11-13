import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../../shared/http/app-env';
import { bodyErrorResponses, errorResponses, json, notFoundResponse } from '../../shared/http/openapi';
import { RuleNotFoundError } from './rules.errors';
import { RuleParams, RulesAddResponse, RulesAddRulePayload, RulesGetRulesResponse, RulesQuery } from './rules.schemas';

const tags = ['rules'];

const getRules = createRoute({
  method: 'get',
  path: '/',
  tags,
  operationId: 'GetRules',
  request: { query: RulesQuery },
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
  request: { params: RuleParams },
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
    params: RuleParams,
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
  request: { params: RuleParams },
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
