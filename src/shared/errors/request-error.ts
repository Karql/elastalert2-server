import { STATUS_CODES } from 'node:http';

/** Media type for error responses (RFC 9457) */
export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

/** Prefix for problem `type` identifiers, e.g. `urn:elastalert2-server:problem:rule-not-found` */
export const PROBLEM_TYPE_PREFIX = 'urn:elastalert2-server:problem:';

/** Problem Details object (RFC 9457) */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  [extension: string]: unknown;
}

export interface RequestErrorOptions {
  /** Problem type slug (prefixed with PROBLEM_TYPE_PREFIX); omit for plain HTTP errors (`about:blank`) */
  type?: string;
  /** Short summary of the problem type; defaults to the HTTP status text */
  title?: string;
  status: number;
  /** Explanation specific to this occurrence */
  detail?: string;
  /** Additional members of the problem object */
  extensions?: Record<string, unknown>;
}

/**
 * Error that is returned to the client as `application/problem+json`.
 */
export default class RequestError extends Error {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
  readonly extensions: Record<string, unknown>;

  constructor({ type, title, status, detail, extensions = {} }: RequestErrorOptions) {
    const resolvedTitle = title ?? STATUS_CODES[status] ?? 'Error';
    super(detail ?? resolvedTitle);

    this.name = new.target.name;
    this.type = type ? PROBLEM_TYPE_PREFIX + type : 'about:blank';
    this.title = resolvedTitle;
    this.status = status;
    this.detail = detail;
    this.extensions = extensions;
  }

  toProblem(instance?: string): ProblemDetails {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      ...(this.detail !== undefined ? { detail: this.detail } : {}),
      ...(instance !== undefined ? { instance } : {}),
      ...this.extensions,
    };
  }
}

/** Plain HTTP error (`type: about:blank`, title is the HTTP status text) */
export class HttpError extends RequestError {
  constructor(status: number, detail?: string) {
    super({ status, detail });
  }
}
