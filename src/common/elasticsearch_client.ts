import elasticsearch, { Client } from 'elasticsearch';
import config from './config';
import fs from 'fs';


export function getClient(): Client {
  let scheme = 'http';
  let ssl_body = {
    rejectUnauthorized: false,
    ca: '',
    cert: '',
    key: ''
  };

  if (config.get().es_ssl) {
    scheme = 'https';
    ssl_body.rejectUnauthorized = config.get().ea_verify_certs;

    if (config.get().es_ca_certs) {
      ssl_body.ca = fs.readFileSync(config.get().es_ca_certs, 'utf8');
    }
    if (config.get().es_client_cert) {
      ssl_body.cert = fs.readFileSync(config.get().es_client_cert, 'utf8');
    }
    if (config.get().es_client_key) {
      ssl_body.key = fs.readFileSync(config.get().es_client_key, 'utf8');
    }
  }

  let auth = '';

  if (config.get().es_username && config.get().es_password) {
    auth = `${config.get().es_username}:${config.get().es_password}@`;
  }

  var client = new elasticsearch.Client({
    hosts: [ `${scheme}://${auth}${config.get().es_host}:${config.get().es_port}`],
    ssl: ssl_body
  });

  return client;
}
