import { Request, Response } from 'express';
import RouteLogger from '../../routes/route_logger';
import ElastalertServer from '../../elastalert_server';
import { sendRequestError } from '../../common/errors/utils';

let logger = new RouteLogger('/templates');

export default function templatesHandler(request: Request, response: Response) {
  let server: ElastalertServer = request.app.get('server');

  let path = <string>request.query.path || '';

  server.templatesController.getTemplates(path)
    .then(function (templates) {
      response.send(templates);
      logger.sendSuccessful();
    })
    .catch(function (error) {
      sendRequestError(response, error);
    });
}
