import type { RequestIdVariables } from 'hono/request-id';
import type ElastalertServer from '../../server';

export type AppEnv = {
  Variables: RequestIdVariables & {
    server: ElastalertServer;
  };
};
