import { Request, Response } from 'express';
import RouteLogger from '../../../routes/route_logger';
import {sendRequestError} from '../../../common/errors/utils';
import ElastalertServer from '../../../elastalert_server';

let logger = new RouteLogger('/rules/:id', 'DELETE');

export default function ruleDeleteHandler(request: Request, response: Response) {
  let server: ElastalertServer = request.app.get('server');

  server.rulesController.rule(request.params.id)
    .then(function (rule) {
      rule.delete()
        .then(function (rule) {
          response.send(rule);
          logger.sendSuccessful({
            deleted: true,
            id: request.params.id
          });
        })
        .catch(function (error) {
          logger.sendFailed(error);
          sendRequestError(response, error);
        });
    })
    .catch(function (error) {
      logger.sendFailed(error);
      sendRequestError(response, error);
    });
}
