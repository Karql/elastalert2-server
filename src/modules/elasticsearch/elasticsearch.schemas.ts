import { z } from '@hono/zod-openapi';
import { pathParam } from '../../shared/http/openapi';

export const IndexParams = z.object({ index: pathParam('index') });

export const MetadataType = z.enum(['elastalert_status', 'elastalert', 'elastalert_error', 'silence']);
export type MetadataType = z.infer<typeof MetadataType>;

export const MetadataParams = z.object({
  type: MetadataType.openapi({ param: { name: 'type', in: 'path' } }),
});

export const MetadataQuery = z.object({
  from: z.coerce.number().optional(),
  size: z.coerce.number().optional(),
  rule_name: z.string().optional(),
});
