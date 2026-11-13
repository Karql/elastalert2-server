import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../../shared/http/app-env';
import { bodyErrorResponses, errorResponses, json, notFoundResponse } from '../../shared/http/openapi';
import { TemplateNotFoundError } from './templates.errors';
import {
  TemplateParams, TemplatesAddResponse, TemplatesAddTemplatePayload, TemplatesGetTemplatesResponse, TemplatesQuery,
} from './templates.schemas';

const tags = ['templates'];

const getTemplates = createRoute({
  method: 'get',
  path: '/',
  tags,
  operationId: 'GetTemplates',
  request: { query: TemplatesQuery },
  responses: {
    200: json(TemplatesGetTemplatesResponse, 'Template ids'),
    ...errorResponses,
  },
});

const getTemplate = createRoute({
  method: 'get',
  path: '/{id}',
  tags,
  operationId: 'GetTemplate',
  request: { params: TemplateParams },
  responses: {
    200: json(z.string(), 'Template yaml'),
    ...notFoundResponse,
    ...errorResponses,
  },
});

// TODO: split to POST and PUT
const addTemplate = createRoute({
  method: 'post',
  path: '/{id}',
  tags,
  operationId: 'AddTemplate',
  request: {
    params: TemplateParams,
    body: { required: true, content: { 'application/json': { schema: TemplatesAddTemplatePayload } } },
  },
  responses: {
    200: json(TemplatesAddResponse, 'Template created or updated'),
    ...bodyErrorResponses,
    ...errorResponses,
  },
});

const deleteTemplate = createRoute({
  method: 'delete',
  path: '/{id}',
  tags,
  operationId: 'DeleteTemplate',
  request: { params: TemplateParams },
  responses: {
    204: { description: 'Template deleted' },
    ...notFoundResponse,
    ...errorResponses,
  },
});

export const templatesRoutes = new OpenAPIHono<AppEnv>()
  .openapi(getTemplates, async (c) => {
    const { path } = c.req.valid('query'); // TODO: probably not used
    const templates = await c.get('server').templatesService.getTemplates(path ?? '');

    return c.json(templates, 200);
  })
  .openapi(getTemplate, async (c) => {
    const { id } = c.req.valid('param');
    const template = await c.get('server').templatesService.template(id);

    return c.json(await template.get(), 200);
  })
  .openapi(addTemplate, async (c) => {
    const { id } = c.req.valid('param');
    const { yaml } = c.req.valid('json');
    const templatesService = c.get('server').templatesService;

    try {
      const template = await templatesService.template(id);
      await template.edit(yaml);
    } catch (error) {
      if (!(error instanceof TemplateNotFoundError)) {
        throw error;
      }

      await templatesService.createTemplate(id, yaml);
    }

    return c.json({ created: true, id }, 200);
  })
  .openapi(deleteTemplate, async (c) => {
    const { id } = c.req.valid('param');
    const template = await c.get('server').templatesService.template(id);

    await template.delete();

    return c.body(null, 204);
  });
