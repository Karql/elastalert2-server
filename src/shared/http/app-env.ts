import type ElastalertServer from '../../server';

export type AppEnv = {
  Variables: {
    server: ElastalertServer;
  };
};
