import { Request, Response } from 'express';
import { getClient } from '../../common/elasticsearch_client';

export default function searchHandler(request: Request, response: Response) {
  /**
   * @type {ElastalertServer}
   */
  var client = getClient();

  client.search({
    index: request.params.index,
    body: request.body
  }).then(function(resp) {
    response.send(resp);
  }, function(error) {
    response.send({ error });
  });

}
