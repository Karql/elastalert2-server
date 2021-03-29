import { Client } from 'elasticsearch';
import { Request, Response } from 'express';
import { getClient } from '../../common/elasticsearch_client';

export default function metadataHandler(request: Request, response: Response) { 
  let client: Client = getClient();

  client.indices.getMapping({
    index: request.params.index
  }).then(function(resp) {
    response.send(resp);
  }, function(err) {
    response.send({
      error: err
    });
  });

}
