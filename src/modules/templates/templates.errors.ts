import RequestError from '../../shared/errors/request-error';

export class TemplateNotFoundError extends RequestError {
  constructor(templateID: string) {
    super({ type: 'template-not-found', title: 'Template not found', status: 404, detail: `The requested template with id: '${templateID}' couldn't be found.` });
  }
}

export class TemplateNotReadableError extends RequestError {
  constructor(templateID: string) {
    super({ type: 'template-not-readable', title: 'Template not readable', status: 403, detail: `The requested template with id: '${templateID}' isn't readable by the file system.` });
  }
}

export class TemplateNotWritableError extends RequestError {
  constructor(templateID: string) {
    super({ type: 'template-not-writable', title: 'Template not writable', status: 403, detail: `The requested template with id: '${templateID}' isn't writable by the file system.` });
  }
}

export class TemplatesFolderNotFoundError extends RequestError {
  constructor(path: string) {
    super({ type: 'templates-folder-not-found', title: 'Templates folder not found', status: 404, detail: `The requested folder with path: '${path}' couldn't be found.` });
  }
}

export class TemplatesRootFolderNotCreatableError extends RequestError {
  constructor() {
    super({ type: 'templates-root-folder-not-creatable', title: 'Templates folder not creatable', status: 403, detail: 'The templates folder wasn\'t found and couldn\'t be created by the file system.' });
  }
}
