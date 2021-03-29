import RouteLogger from '../../routes/route_logger';
import { sendRequestError } from '../../common/errors/utils';
import { Request, Response } from 'express';
import ElastalertServer from '../../elastalert_server';

let logger = new RouteLogger('/rules');

export default function rulesHandler(request: Request, response: Response) {
  let server: ElastalertServer = request.app.get('server');

  let path = <string>request.query.path || '';

  server.rulesController.getRules(path)
    .then(function (rules) {
      response.send(rules);
      logger.sendSuccessful();
    })
    .catch(function (error) {
      sendRequestError(response, error);
    });
}
