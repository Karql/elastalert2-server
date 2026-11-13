import { z } from '@hono/zod-openapi';

export const InfoResponse = z.object({
  name: z.string(),
  port: z.number(),
  version: z.string(),
}).openapi('DefaultIndexResponse');
