import { z } from '@hono/zod-openapi';

// tsoa coerced body values ("1" -> 1, "true" -> true), keep accepting them
const stringToBoolean = (v: unknown) => (v === 'true' ? true : v === 'false' ? false : v);

// Passed to elastalert test_rule as is (--start / --end), it treats timestamps without an offset as UTC
const isoDateTime = z.iso.datetime({ offset: true, local: true });
const toUtcMillis = (s: string) => Date.parse(/(Z|[+-]\d{2}:?\d{2})$/i.test(s) ? s : `${s}Z`);

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
  start: isoDateTime.optional().openapi({
    description: 'Start querying from this timestamp (ISO 8601, without an offset it is UTC). Takes precedence over "days"',
    example: '2026-11-12T00:00:00Z',
  }),
  end: isoDateTime.optional().openapi({
    description: 'Query to this timestamp (ISO 8601, without an offset it is UTC). Default: now. '
      + 'Without "start" the test covers "days" before "end"',
    example: '2026-11-13T00:00:00Z',
  }),
}).strict().refine((o) => !o.start || !o.end || toUtcMillis(o.end) > toUtcMillis(o.start), {
  message: '"end" must be after "start"',
  path: ['end'],
}).openapi('TestRuleOptions');

export type TestRuleOptions = z.output<typeof TestRuleOptionsSchema>;

export const TestRuleOptionsDefaults: TestRuleOptions = TestRuleOptionsSchema.parse({});

export const TestRulePayload = z.object({
  rule: z.string(),
  options: TestRuleOptionsSchema.optional(),
}).strict().openapi('TestRulePayload');
