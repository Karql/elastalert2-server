import { Request, Response } from 'express';
import RouteLogger from '../routes/route_logger';
import config from '../common/config';

const npm = require('../../package.json');

let logger = new RouteLogger('/');

export default function indexHandler(request: Request, response: Response) {
  let info = {
    name: config.get().appName,
    port: config.get().port,
    version: npm.version
  };

  response.send(info);
  logger.sendSuccessful();
}
