import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import type { AppEnv } from '../../shared/http/app-env';
import { errorResponses, json } from '../../shared/http/openapi';
import { Status } from './process-status';
import { StatusControlParams, StatusControlResponse, StatusIndexResponse } from './status.schemas';

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
  request: { params: StatusControlParams },
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
