import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../app-env';
import { Status } from '../common/status.model';
import { errorResponses, json } from './openapi';

const StatusIndexResponse = z.object({
  status: z.string(),
}).openapi('StatusIndexResponse');

const StatusControlResponse = z.object({
  success: z.boolean(),
}).openapi('StatusControlResponse');

const index = createRoute({
  method: 'get',
  path: '/',
  tags: ['status'],
  operationId: 'GetStatus',
  responses: {
    200: json(StatusIndexResponse, 'ElastAlert process status'),
  },
});

const control = createRoute({
  method: 'get',
  path: '/control/{action}',
  tags: ['status'],
  operationId: 'Control',
  request: {
    params: z.object({
      action: z.enum(['start', 'stop']).openapi({ param: { name: 'action', in: 'path' } }),
    }),
  },
  responses: {
    200: json(StatusControlResponse, 'Whether the action was executed'),
    ...errorResponses,
  },
});

export const statusRoutes = new OpenAPIHono<AppEnv>()
  .openapi(index, (c) => {
    const status = c.get('server').processService.status;

    return c.json({
      status: status !== undefined ? Status[status] : Status[Status.UNDEFINED],
    }, 200);
  })
  .openapi(control, (c) => {
    const { action } = c.req.valid('param');
    const processService = c.get('server').processService;

    if (action === 'start') {
      processService.start();
    } else {
      processService.stop();
    }

    return c.json({ success: true }, 200);
  });
