import elasticsearch, { Client } from 'elasticsearch';
import config from './config';

export function getClient(): Client {
  
  var client = new elasticsearch.Client({
    hosts: [ `http://${config.get().es_host}:${config.get().es_port}`]
  });
  return client;
}
