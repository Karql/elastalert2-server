import { Request, Response } from 'express';
import RouteLogger from '../../../routes/route_logger';
import {sendRequestError} from '../../../common/errors/utils';
import ElastalertServer from '../../../elastalert_server';

let logger = new RouteLogger('/templates/:id', 'DELETE');

export default function templateDeleteHandler(request: Request, response: Response) {
  let server: ElastalertServer = request.app.get('server');

  server.templatesController.template(request.params.id)
    .then(function (template) {
      template.delete()
        .then(function (template) {
          response.send(template);
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
