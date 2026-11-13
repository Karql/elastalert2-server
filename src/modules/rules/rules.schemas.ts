import { z } from '@hono/zod-openapi';
import { pathParam } from '../../shared/http/openapi';

export const RuleParams = z.object({ id: pathParam('id', 'my_rule') });

export const RulesQuery = z.object({ path: z.string().optional() });

export const RulesGetRulesResponse = z.object({
  rules: z.array(z.string()),
}).openapi('RulesGetRulesResponse');

export const RulesAddRulePayload = z.object({
  yaml: z.string(),
}).strict().openapi('RulesAddRulePayload');

export const RulesAddResponse = z.object({
  created: z.boolean(),
  id: z.string(),
}).openapi('RulesAddResponse');
