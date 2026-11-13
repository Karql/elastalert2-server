import type ElastalertServer from './elastalert_server';

export type AppEnv = {
  Variables: {
    server: ElastalertServer;
  };
};
