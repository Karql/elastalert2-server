import { z } from '@hono/zod-openapi';
import { PROBLEM_CONTENT_TYPE } from '../errors/request-error';

export const ProblemDetails = z.object({
  type: z.string().openapi({ example: 'urn:elastalert2-server:problem:rule-not-found' }),
  title: z.string().openapi({ example: 'Rule not found' }),
  status: z.number().int().openapi({ example: 404 }),
  detail: z.string().optional(),
  instance: z.string().optional().openapi({ example: '/rules/my_rule' }),
}).openapi('ProblemDetails', { description: 'Problem Details (RFC 9457)' });

export const ValidationProblemDetails = ProblemDetails.extend({
  errors: z.array(z.object({
    detail: z.string(),
    pointer: z.string().optional().openapi({ description: 'JSON Pointer to the invalid body member', example: '#/yaml' }),
    parameter: z.string().optional().openapi({ description: 'Name of the invalid parameter', example: 'action' }),
    in: z.string().optional().openapi({ description: 'Parameter location', example: 'path' }),
  })),
}).openapi('ValidationProblemDetails');

export const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { 'application/json': { schema } },
});

const problem = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { [PROBLEM_CONTENT_TYPE]: { schema } },
});

/** For routes with validated path / query parameters or body */
export const errorResponses = {
  422: problem(ValidationProblemDetails, 'Request validation failed'),
  500: problem(ProblemDetails, 'Internal error'),
};

/** For routes with a JSON request body */
export const bodyErrorResponses = {
  400: problem(ProblemDetails, 'Malformed JSON in request body'),
  415: problem(ProblemDetails, 'Unsupported media type (body must be application/json)'),
};

export const notFoundResponse = {
  404: problem(ProblemDetails, 'Not found'),
};

export const pathParam = (name: string, example?: string) =>
  z.string().min(1).openapi({ param: { name, in: 'path' }, example });
