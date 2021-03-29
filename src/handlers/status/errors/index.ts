import { Request, Response } from 'express';

import RouteLogger from '../../../routes/route_logger';

let logger = new RouteLogger('/status/errors');

export default function errorsHandler(request: Request, response: Response) {
  response.send({
    path: '/status/errors',
    method: 'GET',
    handler: 'errorsHandler'
  });

  logger.sendSuccessful();
}
