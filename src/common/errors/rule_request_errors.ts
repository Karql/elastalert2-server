import RequestError from './request_error';

export class RuleNotFoundError extends RequestError {
  constructor(ruleID: string) {
    super({ type: 'rule-not-found', title: 'Rule not found', status: 404, detail: `The requested rule with id: '${ruleID}' couldn't be found.` });
  }
}

export class RuleNotReadableError extends RequestError {
  constructor(ruleID: string) {
    super({ type: 'rule-not-readable', title: 'Rule not readable', status: 403, detail: `The requested rule with id: '${ruleID}' isn't readable by the file system.` });
  }
}

export class RuleNotWritableError extends RequestError {
  constructor(ruleID: string) {
    super({ type: 'rule-not-writable', title: 'Rule not writable', status: 403, detail: `The requested rule with id: '${ruleID}' isn't writable by the file system.` });
  }
}

export class RulesFolderNotFoundError extends RequestError {
  constructor(path: string) {
    super({ type: 'rules-folder-not-found', title: 'Rules folder not found', status: 404, detail: `The requested folder with path: '${path}' couldn't be found.` });
  }
}

export class RulesRootFolderNotCreatableError extends RequestError {
  constructor() {
    super({ type: 'rules-root-folder-not-creatable', title: 'Rules folder not creatable', status: 403, detail: 'The rules folder wasn\'t found and couldn\'t be created by the file system.' });
  }
}
