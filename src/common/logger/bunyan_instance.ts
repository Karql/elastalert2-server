import bunyan from 'bunyan';

const logger = {
  ElastalertServer: bunyan.createLogger({
    name: 'elastalert-server'
  }),
  Elastalert: bunyan.createLogger({
    name: 'elastalert'
  })
}

export default logger;
