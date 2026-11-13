import { z } from 'zod';
import RequestError from './request-error';

export interface ValidationErrorItem {
  detail: string;
  /** JSON Pointer to the invalid body member (RFC 6901), e.g. `#/options/days` */
  pointer?: string;
  /** Name of the invalid path / query / header parameter */
  parameter?: string;
  in?: string;
}

const parameterLocations: Record<string, string> = { param: 'path', query: 'query', header: 'header', cookie: 'cookie' };

const escapePointer = (segment: PropertyKey) => String(segment).replace(/~/g, '~0').replace(/\//g, '~1');

function toErrorItem(target: string, path: PropertyKey[], detail: string): ValidationErrorItem {
  if (target === 'json' || target === 'form') {
    return { detail, pointer: '#' + path.map((p) => '/' + escapePointer(p)).join('') };
  }

  return {
    detail,
    ...(path.length > 0 ? { parameter: String(path[0]) } : {}),
    in: parameterLocations[target] ?? target,
  };
}

/** Request did not match the route's Zod schema -> 422 */
export class ValidationError extends RequestError {
  constructor(target: string, error: z.ZodError) {
    const errors: ValidationErrorItem[] = [];

    for (const issue of error.issues) {
      if (issue.code === 'unrecognized_keys') {
        for (const key of issue.keys) {
          errors.push(toErrorItem(target, [...issue.path, key], `Property "${key}" is not allowed`));
        }
      } else {
        errors.push(toErrorItem(target, issue.path, issue.message));
      }
    }

    super({
      type: 'validation-error',
      title: 'Request validation failed',
      status: 422,
      detail: `The request contains ${errors.length} invalid value${errors.length === 1 ? '' : 's'}.`,
      extensions: { errors },
    });
  }
}
