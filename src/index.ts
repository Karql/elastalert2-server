import ConfigService from './common/config/config.service'
import ElastalertServer from './elastalert_server';

(async () => {
  // Load configuration
  let configService = ConfigService.getInstance();
  await configService.load();

  if (process.env.SENTRY_DSN !== undefined) {
    var Raven = require('raven');
    Raven.config(process.env.SENTRY_DSN, {
      captureUnhandledRejections: true
    }).install();
    console.log('Sentry logging enabled for Elastalert');

    Raven.context(async () => {
      let server = new ElastalertServer();
      await server.start();
    });
  } else {
    let server = new ElastalertServer();
    await server.start();
  }
})();