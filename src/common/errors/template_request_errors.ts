import RequestError from './request_error';

export class TemplateNotFoundError extends RequestError {
  constructor(templateID: string) {
    super('templateNotFound', `The requested template with id: '${templateID}' couldn't be found.`, 404);
  }
}

export class TemplateNotReadableError extends RequestError {
  constructor(templateID: string) {
    super('templateNotReadable', `The requested template with id: '${templateID}' isn't readable by the file system.`, 403);
  }
}

export class TemplateNotWritableError extends RequestError {
  constructor(templateID: string) {
    super('templateNotWritable', `The requested template with id: '${templateID}' isn't writable by the file system.`, 403);
  }
}

export class TemplatesFolderNotFoundError extends RequestError {
  constructor(path: string) {
    super('templatesFolderNotFound', `The requested folder with path: '${path}' couldn't be found.`, 404);
  }
}

export class TemplatesFolderNotReadableError extends RequestError {
  constructor(path: string) {
    super('templatesFolderNotReadable', `The requested folder with path: '${path}' isn't readable by the file system.`, 403);
  }
}

export class TemplatesFolderNotWritableError extends RequestError {
  constructor(path: string) {
    super('templatesFolderNotWritable', `The requested folder with path: '${path}' isn't writable by the file system.`, 403);
  }
}

export class TemplatesRootFolderNotCreatableError extends RequestError {
  constructor() {
    super('templatesRootFolderNotCreatable', 'The templates folder wasn\'t found and couldn\'t be created by the file system.', 403);
  }
}
