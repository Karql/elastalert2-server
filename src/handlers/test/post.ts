import { Request, Response } from 'express';
import RouteLogger from '../../routes/route_logger';
import {sendRequestError} from '../../common/errors/utils';
import {BodyNotSendError, RuleNotSendError, OptionsInvalidError} from '../../common/errors/test_request_errors';
import Joi from 'joi';
import ElastalertServer from '../../elastalert_server';

let logger = new RouteLogger('/test', 'POST');

const optionsSchema = Joi.object().keys({
  testType: Joi.string().valid('all', 'schemaOnly', 'countOnly').default('all'),
  days: Joi.number().min(1).default(1),
  alert: Joi.boolean().default(false),
  format: Joi.string().default(''),
  maxResults: Joi.number().default(0)
}).default();

function analyzeRequest(request: Request) {
  if (!request.body) {
    return new BodyNotSendError();
  }

  if (!request.body.rule) {
    return new RuleNotSendError();
  }

  const validationResult = optionsSchema.validate(request.body.options);

  if (validationResult.error) {
    return new OptionsInvalidError(validationResult.error);
  }

  let body = request.body;
  body.options = validationResult.value;

  return body;
}

export default function testPostHandler(request: Request, response: Response) {
  let server: ElastalertServer = request.app.get('server');
  let body = analyzeRequest(request);

  if (body.error) {
    logger.sendFailed(body.error);
    sendRequestError(response, body.error);
  }

  server.testController.testRule(body.rule, body.options)
    .then(function (consoleOutput) {
      response.send(consoleOutput);
    })
    .catch(function (consoleOutput) {
      response.status(500).send(consoleOutput);
    });
}
