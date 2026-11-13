import { z } from '@hono/zod-openapi';
import { pathParam } from '../../shared/http/openapi';

export const TemplateParams = z.object({ id: pathParam('id', 'my_template') });

export const TemplatesQuery = z.object({ path: z.string().optional() });

export const TemplatesGetTemplatesResponse = z.object({
  templates: z.array(z.string()),
}).openapi('TemplatesGetTemplatesResponse');

export const TemplatesAddTemplatePayload = z.object({
  yaml: z.string(),
}).strict().openapi('TemplatesAddTemplatePayload');

export const TemplatesAddResponse = z.object({
  created: z.boolean(),
  id: z.string(),
}).openapi('TemplatesAddResponse');
