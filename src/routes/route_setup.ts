import lodash from 'lodash';
import Logger from '../common/logger';
import routes from './routes';
import { Express, RequestHandler } from 'express';
import { Route, RouteMethod } from './route.model';

let logger = new Logger('Router');

export default function setupRouter(express: Express) {
  routes.forEach((route) => {

    if (lodash.isArray(route.method)) {
      route.method.forEach((method, index) => {
        _setupRoute(
          lodash.merge(
            lodash.cloneDeep(route), {
              method: method,
              handler: (<RequestHandler[]>route.handler)[index]
            }));
      });
    } else {
      _setupRoute(route);
    }
  });

  function _setupRoute(route: Route) {
    let methodFunctionName = (<string>route.method).toLowerCase();

    express['get']('/dupa',  (req, res) => {});

    express.get('dupa', (req, res) => {})


    express[<RouteMethod>route.method]('/' + route.path, <RequestHandler>route.handler);
    logger.info('Listening for ' + route.method + ' request on /' + route.path + '.');
  }
}
