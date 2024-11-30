import { Controller, Get, Route, Request, Tags, Path } from "@tsoa/runtime";
import { Request as ExpressRequest } from 'express';

import {Status} from '../common/status.model';
import ElastalertServer from '../elastalert_server';

interface SatusIndexResponse {
    status: string;
}

interface StatusControlResponse {
    success: boolean;
}

@Route("/status")
@Tags("status")
export class StatusController extends Controller {
    @Get("")
    public async index(@Request() request: ExpressRequest): Promise<SatusIndexResponse> {
        let server: ElastalertServer = request.app.get('server');
        var status = server?.processService?.status; // TODO

        return {
            status: status ? Status[status] : Status[Status.UNDEFINED]
        }
    }

    @Get("control/{action}")
    public async control(@Request() request: ExpressRequest, @Path("action") action: "start" | "stop"): Promise<StatusControlResponse> {
        let server: ElastalertServer = request.app.get('server');

        let success = false;

        switch (request.params.action) {
          case 'start':
            server.processService.start();
            success = true;
            break;
          case 'stop':
            server.processService.stop();
            success = true;
            break;
          default:
            success = false;
            break;
        }
      
        return {
          success: success,
        };
    }
}