import bunyan from 'bunyan';

const logger = bunyan.createLogger({
  name: 'elastalert-server'
});

export default logger;
