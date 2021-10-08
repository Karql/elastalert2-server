import { Controller, Get, Route, Tags } from "@tsoa/runtime";
import config from '../common/config';
import RouteLogger from '../routes/route_logger';

const npm = require('../../package.json');

interface DefaultIndexResponse {
  name: string;
  port: number;
  version: string;
}

let logger = new RouteLogger('/');

@Route("/")
@Tags("default")
export class DefaultController extends Controller {
    @Get("")
    public async index(): Promise<DefaultIndexResponse> {
        let info: DefaultIndexResponse = {
            name: config.get().appName,
            port: config.get().port,
            version: npm.version
        };

        logger.sendSuccessful();
        return info;
    }
}