import { ChildProcessWithoutNullStreams, spawn, spawnSync } from 'child_process';
import readline from 'readline';
import type { Readable } from 'stream';
import { config } from '../../shared/config/config.service';
import Logger from '../../shared/logger/logger';
import { ElastalertLogLevel, ElastalertLogParser } from './elastalert-log-parser';
import { Status } from './process-status';

const logger = new Logger('ProcessService');

const ElastalertLoggers: { [Key: string]: Logger } = {};

export default class ProcessService {
  private _onExitCallbacks: {(): void;}[];
  private _status: Status;
  private _process: ChildProcessWithoutNullStreams | null;

  constructor() {
    this._onExitCallbacks = [];
    this._status = Status.IDLE;

    /**
     * @type {ChildProcess}
     * @private
     */
    this._process = null;
  }

  onExit(onExitCallback: {(): void}) {
    this._onExitCallbacks.push(onExitCallback);
  }

  get status() {
    return this._status;
  }

  /**
   * Start ElastAlert if it isn't already running.
   */
  start() {
    // Do not do anything if ElastAlert is already running
    if (this._process !== null) {
      logger.warn('ElastAlert is already running!');
      return;
    }

    let cfg = config.get();

    // Start ElastAlert from the directory specified in the config
    logger.info('Starting ElastAlert');
    this._status = Status.STARTING;

    // Create ElastAlert index if it doesn't exist yet
    logger.info('Creating index');
    const indexCreate = spawnSync('python', ['-m', 'elastalert.create_index', '--index', cfg.writeback_index, '--old-index', ''], {
      cwd: cfg.elastalertPath
    });

    // Redirect stdout/stderr to logger
    // create_index prints its output without the logging prefix
    this.logElastalertOutput(indexCreate.stdout?.toString(), 'INFO', 'create_index');
    this.logElastalertOutput(indexCreate.stderr?.toString(), 'ERROR', 'create_index');

    // Set listeners for index create exit
    if (indexCreate.status === 0) {
      logger.info(`Index create exited with code ${indexCreate.status}`);
    } else {
      logger.error(`Index create exited with code ${indexCreate.status}`);
      logger.warn('ElastAlert will start but might not be able to save its data!');
    }

    let startArguments: string[] = [];

    let start = cfg.start?.toISOString();

    if (start !== undefined && start !== null) {
      logger.info('Setting ElastAlert query beginning to time ' + start);
      startArguments.push('--start', start);
    }

    let end = cfg.end?.toISOString();

    if (end !== undefined && end !== null) {
      logger.info('Setting ElastAlert query ending to time ' + end);
      startArguments.push('--end', end);
    }

    if (cfg.debug === true) {
      logger.info('Setting ElastAlert debug mode. This will increase the logging verboseness, change all alerts to DebugAlerter, which prints alerts and suppresses their normal action, and skips writing search and alert metadata back to Elasticsearch.');
      startArguments.push('--debug');
    }

    if (cfg.verbose === true) {
      logger.info('Setting ElastAlert verbose mode. This will increase the logging verboseness, which allows you to see information about the state of queries.');
      startArguments.push('--verbose');
    }

    if (cfg.es_debug === true) {
      logger.info('Setting ElastAlert es_debug mode. This will enable logging for all queries made to Elasticsearch.');
      startArguments.push('--es_debug');
    }

    if (cfg.prometheus_port != null && cfg.prometheus_port > 0) {
      logger.info(`Setting ElastAlert prometheus_port to ${cfg.prometheus_port}. This will expose ElastAlert 2 Prometheus metrics on the specified port.`);
      startArguments.push('--prometheus_port', cfg.prometheus_port.toString());
    }

    logger.info('Starting elastalert with arguments ' + (startArguments.join(' ') || '[none]'));

    this._process = spawn('python', ['-m', 'elastalert.elastalert'].concat(startArguments), {
      cwd: cfg.elastalertPath
    });

    logger.info(`Started Elastalert (PID: ${this._process.pid})`);
    this._status = Status.READY;

    // Redirect stdout/stderr to logger
    this.pipeElastalertOutput(this._process.stdout, 'INFO');
    this.pipeElastalertOutput(this._process.stderr, 'ERROR');

    // Set listeners for ElastAlert exit
    // 'close' (not 'exit') fires after stdout/stderr ended, so the last logs (e.g. a traceback) are already written
    this._process.on('close', (code) => {
      if (code === 0) {
        logger.info(`ElastAlert exited with code ${code}`);
        this._status = Status.IDLE;
      } else {
        logger.error(`ElastAlert exited with code ${code}`);
        this._status = Status.ERROR;
      }
      this._process = null;

      this._onExitCallbacks.forEach((onExitCallback) => onExitCallback());
    });

    // Set listener for ElastAlert error
    this._process.on('error', (err) => {
      logger.error(`ElastAlert error: ${err.toString()}`);
      this._status = Status.ERROR;
      this._process = null;
    });
  }

  /**
   * Stop ElastAlert if it is running.
   */
  stop() {
    if (this._process !== null) {
      // Stop ElastAlert
      logger.info(`Stopping ElastAlert (PID: ${this._process.pid})`);
      this._status = Status.CLOSING;
      this._process.kill('SIGINT');
    } else {
      // Do not do anything if ElastAlert is not running
      logger.info('ElastAlert is not running');
    }
  }

  private getElastalertLogger(type: string): Logger {
    if (ElastalertLoggers[type] === undefined) {
      ElastalertLoggers[type] = new Logger(type, "Elastalert");
    }

    return ElastalertLoggers[type];
  }

  /**
   * Logs output of a running ElastAlert2 process line by line.
   * Lines without the python logging prefix (e.g. a traceback) are logged with `defaultLevel`.
   */
  private pipeElastalertOutput(stream: Readable, defaultLevel: ElastalertLogLevel) {
    const parser = new ElastalertLogParser(defaultLevel, 'elastalert', (level, type, msg) => this.logElastalert(level, type, msg));
    const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });

    lines.on('line', (line) => parser.line(line));
    lines.on('close', () => parser.flush());
  }

  /** Logs the whole output of a finished ElastAlert2 process */
  private logElastalertOutput(output: string | undefined, defaultLevel: ElastalertLogLevel, defaultType: string) {
    if (!output) {
      return;
    }

    const parser = new ElastalertLogParser(defaultLevel, defaultType, (level, type, msg) => this.logElastalert(level, type, msg));
    parser.text(output);
    parser.flush();
  }

  private logElastalert(level: ElastalertLogLevel, type: string, msg: string) {
    let elastalertLogger = this.getElastalertLogger(type);

    switch (level) {
        case "DEBUG": {
          elastalertLogger.debug(msg);
          break;
        }
        case "INFO": {
          elastalertLogger.info(msg);
          break;
        }
        case "WARNING": {
          elastalertLogger.warn(msg);
          break;
        }
        case "ERROR": {
          elastalertLogger.error(msg);
          break;
        }
        case "CRITICAL": {
          elastalertLogger.fatal(msg);
          break;
        }
        default: {
          elastalertLogger.info(msg);
          break;
        }
    }
  }
}
