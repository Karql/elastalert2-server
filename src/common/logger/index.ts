import bunyan from './bunyan_instance';

export default class Logger {
  private serviceName: string;

  constructor (serviceName: string) {
    this.serviceName = serviceName;
  }

  info (...messages: any[]) {
    bunyan.info(this.serviceName + ': ', ...messages);
  }

  warn (...messages: any[]) {
    bunyan.warn(this.serviceName + ': ', ...messages);
  }

  error (...messages: any[]) {
    bunyan.error(this.serviceName + ': ', ...messages);
  }

  debug (...messages: any[]) {
    bunyan.debug(this.serviceName + ': ', ...messages);
  }
}
