import RequestError from './request_error';

export class OptionsInvalidError extends RequestError {
  constructor(error: any) {
    super('optionsInvalid', 'Testing: rule failed because the options send were invalid. Error message below.', 400, error);
  }
}

export class RuleNotSendError extends RequestError {
  constructor() {
    super('ruleNotSend', 'Testing: rule failed because no rule was send in the request body.', 400);
  }
}

export class BodyNotSendError extends RequestError {
  constructor() {
    super('bodyNotSend', 'Testing: rule failed because no request body was send.', 400);
  }
}

export class TestRuleError extends RequestError {
  constructor(message: string) {
    super('testRuleError', message, 500);
  }
}
