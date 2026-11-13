import { z } from '@hono/zod-openapi';

// tsoa coerced body values ("1" -> 1, "true" -> true), keep accepting them
const stringToBoolean = (v: unknown) => (v === 'true' ? true : v === 'false' ? false : v);

export const TestRuleOptionsSchema = z.object({
  testType: z.enum(['all', 'schemaOnly', 'countOnly']).default('all').openapi({
    description: 'Can be either "all", "schemaOnly" or "countOnly".\n'
      + '"all" will give the full console output.\n'
      + '"schemaOnly" will only validate the yaml config.\n'
      + '"countOnly" will only find the number of matching documents and list available fields.',
  }),
  days: z.coerce.number().int().min(1).default(1).openapi({
    description: 'Can be any number larger than 0 and this tells ElastAlert over a period of how many days the test should be run',
  }),
  alert: z.preprocess(stringToBoolean, z.boolean()).default(false).openapi({
    description: 'Whether to send real alerts',
  }),
  format: z.enum(['json']).optional().openapi({
    description: "When 'json' return results in structured JSON",
  }),
  maxResults: z.coerce.number().default(0).openapi({
    description: 'Limit returned results to this amount (0 means no limit)',
  }),
}).strict().openapi('TestRuleOptions');

export type TestRuleOptions = z.output<typeof TestRuleOptionsSchema>;

export const TestRuleOptionsDefaults: TestRuleOptions = TestRuleOptionsSchema.parse({});
