import { ChildProcessWithoutNullStreams, spawn, spawnSync } from 'child_process';
import config from '../common/config';
import Logger from '../common/logger';
import { Status } from '../common/status.model';

const logger = new Logger('ProcessService');

const ElastalertSplitLogsRegexp = /(?<level>DEBUG|INFO|WARNING|ERROR|CRITICAL):(?<type>\S+?):(?<message>.*?)(?=(?:(?:DEBUG|INFO|WARNING|ERROR|CRITICAL):\S+:)|$)/sg;
const ElastalertCleanMessageRegexp = /\n|\s{2,}/g;
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
    var indexCreate = spawnSync('python', ['-m', 'elastalert.create_index', '--index', cfg.writeback_index, '--old-index', ''], {
      cwd: cfg.elastalertPath
    });

    // Redirect stdin/stderr to logger
    // create_index does not use logger
    if (indexCreate.stdout && indexCreate.stdout.toString() !== '') {
      this.logElastalert("INFO", "create_index", indexCreate.stdout.toString())
    }
    if (indexCreate.stderr && indexCreate.stderr.toString() !== '') {
      this.logElastalert("ERROR", "create_index", indexCreate.stderr.toString())
    }

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

    // Redirect stdin/stderr to logger
    this._process.stdout.on('data', (data) => {
      this.processElastalertLogs(data.toString());
    });
    this._process.stderr.on('data', (data) => {
      this.processElastalertLogs(data.toString());
    });

    // Set listeners for ElastAlert exit
    this._process.on('exit', (code) => {
      if (code === 0) {
        logger.info(`ElastAlert exited with code ${code}`);
        this._status = Status.IDLE;
      } else {
        logger.error(`ElastAlert exited with code ${code}`);
        this._status = Status.ERROR;
      }
      this._process = null;

      this._onExitCallbacks.map(function(onExitCallback) {
        if (onExitCallback !== null) {
          onExitCallback();
        }
      });
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

  public processElastalertLogs(logs: string) {
    if (logs == null || logs.trim() === '') {
      return;
    }

    let matches = logs.matchAll(ElastalertSplitLogsRegexp);
    let anyMatch = false;

    for (const match of matches) {
      if (match.groups === undefined) {
        break;
      }

      let level = match.groups['level'];
      let type = match.groups['type'];
      let msg = match.groups['message'];

      this.logElastalert(level, type, msg);
      anyMatch = true;
    }

    if (!anyMatch) {
      logger.warn(`No matches while process elastalert log: ${logs}`);
    }
  }

  private logElastalert(level: string, type: string, msg: string) {
    let elastalertLogger = this.getElastalertLogger(type);
    msg = msg.trim();
    msg = msg.replace(ElastalertCleanMessageRegexp, ' ');

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
