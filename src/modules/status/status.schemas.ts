import { z } from '@hono/zod-openapi';

export const StatusIndexResponse = z.object({
  status: z.string(),
}).openapi('StatusIndexResponse');

export const StatusControlParams = z.object({
  action: z.enum(['start', 'stop']).openapi({ param: { name: 'action', in: 'path' } }),
});

export const StatusControlResponse = z.object({
  success: z.boolean(),
}).openapi('StatusControlResponse');
