import bunyan from './bunyan_instance';

export default class Logger {
  private serviceName: string;
  private loggerType: "ElastalertServer" | "Elastalert";

  constructor (serviceName: string, loggerType: "ElastalertServer" | "Elastalert" = "ElastalertServer") {
    this.serviceName = serviceName;
    this.loggerType = loggerType;
  }

  debug (...messages: any[]) {
    this.getLogger().debug(this.serviceName + ': ', ...messages);
  }

  info (...messages: any[]) {
    this.getLogger().info(this.serviceName + ': ', ...messages);
  }

  warn (...messages: any[]) {
    this.getLogger().warn(this.serviceName + ': ', ...messages);
  }

  error (...messages: any[]) {
    this.getLogger().error(this.serviceName + ': ', ...messages);
  }

  fatal (...messages: any[]) {
    this.getLogger().fatal(this.serviceName + ': ', ...messages);
  }

  private getLogger() {
    return bunyan[this.loggerType];
  }
}
