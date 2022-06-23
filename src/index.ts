import ConfigService from './common/config/config.service'
import ElastalertServer from './elastalert_server';

(async () => {
  // Load configuration
  let configService = ConfigService.getInstance();
  await configService.load();

  let server = new ElastalertServer();
  await server.start();
})();
