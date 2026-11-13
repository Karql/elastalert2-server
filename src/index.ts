import { config } from './shared/config/config.service';
import ElastalertServer from './server';

(async () => {
  // Load configuration
  await config.load();

  const server = new ElastalertServer();
  await server.start();
})();
