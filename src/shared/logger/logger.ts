import util from 'util';
import { getPinoLogger, type LoggerType } from './logging';

type Level = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Logger for one component, e.g. `new Logger('Config')` logs `{"name":"elastalert-server","component":"Config",...}`.
 *
 * Messages are formatted like `console.log`. An `Error` argument is logged in the `err` field (with stack trace)
 * instead of being added to the message.
 */
export default class Logger {
  private component: string;
  private loggerType: LoggerType;

  constructor (component: string, loggerType: LoggerType = 'ElastalertServer') {
    this.component = component;
    this.loggerType = loggerType;
  }

  debug (...messages: unknown[]) {
    this.write('debug', messages);
  }

  info (...messages: unknown[]) {
    this.write('info', messages);
  }

  warn (...messages: unknown[]) {
    this.write('warn', messages);
  }

  error (...messages: unknown[]) {
    this.write('error', messages);
  }

  fatal (...messages: unknown[]) {
    this.write('fatal', messages);
  }

  private write(level: Level, messages: unknown[]) {
    // Resolved on every call, so loggers created before the config is loaded use the configured level and format
    const logger = getPinoLogger(this.loggerType, this.component);

    if (!logger.isLevelEnabled(level)) {
      return;
    }

    const err = messages.find((m) => m instanceof Error);
    const msg = util.format(...(err ? messages.filter((m) => m !== err) : messages));

    if (err) {
      logger[level]({ err }, msg);
    } else {
      logger[level](msg);
    }
  }
}
