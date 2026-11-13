import RequestError from '../../shared/errors/request-error';

export class TestRuleError extends RequestError {
  constructor(message: string) {
    super({ type: 'test-rule-failed', title: 'Rule test failed', status: 500, detail: message });
  }
}
