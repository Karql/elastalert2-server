import os from 'os';
import pino, { type DestinationStream, type Logger as PinoLogger } from 'pino';
import pretty from 'pino-pretty';

export const logLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;
export type LogLevel = typeof logLevels[number];

export const logFormats = ['json', 'pretty'] as const;
export type LogFormat = typeof logFormats[number];

/** `ElastalertServer` - logs of this server, `Elastalert` - logs of the ElastAlert2 python processes */
export type LoggerType = 'ElastalertServer' | 'Elastalert';

export interface LoggingOptions {
  level: LogLevel;
  format: LogFormat;
  /** Value of the `name` field for logs of this server (`appName` from the config) */
  serverName: string;
}

// Structured fields of request logs, hidden in the pretty format (the message already contains them)
const requestFields = ['method', 'path', 'status', 'durationMs', 'requestId'];

let options: LoggingOptions = applyEnv({ level: 'info', format: 'json', serverName: 'elastalert-server' });
let root = createRoot(options);
const loggers = new Map<string, PinoLogger>();

/**
 * Applies the logging section of the config.
 * `LOG_LEVEL` and `LOG_FORMAT` environment variables take precedence over the config file.
 */
export function configureLogging(configured: LoggingOptions) {
  const invalidEnv: string[] = [];

  options = applyEnv(configured, invalidEnv);
  root = createRoot(options);
  loggers.clear();

  invalidEnv.forEach((warning) => getPinoLogger('ElastalertServer', 'Logging').warn(warning));
}

export function getLoggingOptions(): Readonly<LoggingOptions> {
  return options;
}

/** Returns a pino logger with `name` and `component` fields, e.g. `{ name: 'elastalert-server', component: 'Config' }` */
export function getPinoLogger(type: LoggerType, component: string): PinoLogger {
  const key = `${type}:${component}`;
  let logger = loggers.get(key);

  if (!logger) {
    const name = type === 'Elastalert' ? 'elastalert' : options.serverName;
    logger = root.child({ name, component });
    loggers.set(key, logger);
  }

  return logger;
}

function createRoot(opts: LoggingOptions): PinoLogger {
  return pino({
    level: opts.level,
    base: { pid: process.pid, hostname: os.hostname() },
    timestamp: pino.stdTimeFunctions.isoTime,
  }, createDestination(opts.format));
}

function createDestination(format: LogFormat): DestinationStream {
  if (format === 'pretty') {
    return pretty({
      sync: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
      ignore: ['pid', 'hostname', 'name', 'component', ...requestFields].join(','),
      messageFormat: '{name} {component}: {msg}',
    });
  }

  // Synchronous, so nothing is lost when the process exits right after logging
  return pino.destination({ dest: 1, sync: true });
}

function applyEnv(opts: LoggingOptions, invalidEnv: string[] = []): LoggingOptions {
  return {
    ...opts,
    level: fromEnv('LOG_LEVEL', logLevels, invalidEnv) ?? opts.level,
    format: fromEnv('LOG_FORMAT', logFormats, invalidEnv) ?? opts.format,
  };
}

function fromEnv<T extends string>(name: string, allowed: readonly T[], invalidEnv: string[]): T | undefined {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) {
    return undefined;
  }

  if (!(allowed as readonly string[]).includes(value)) {
    invalidEnv.push(`Ignoring invalid ${name}="${process.env[name]}", allowed values: ${allowed.join(', ')}`);
    return undefined;
  }

  return value as T;
}
