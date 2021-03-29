import { Request, Response } from 'express';
import {Status} from '../../common/status.model';
import ElastalertServer from '../../elastalert_server';

export default function statusHandler(request: Request, response: Response) {
  let server: ElastalertServer = request.app.get('server');
  var status = server?.processController?.status; // TODO

  response.send({
    status: status ? Status[status] : "UNDEFINED"
  });
}
