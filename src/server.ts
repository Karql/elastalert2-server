import { serve, type ServerType } from '@hono/node-server';
import path from 'path';
import WebSocket from 'ws';
import { createApp } from './app';
import RulesService from './modules/rules/rules.service';
import ProcessService from './modules/status/process.service';
import TemplatesService from './modules/templates/templates.service';
import TestService from './modules/test/test.service';
import { listenTestWebSocket } from './modules/test/test.ws';
import { config } from './shared/config/config.service';
import FileSystemService from './shared/file-system/file-system.service';
import Logger from './shared/logger/logger';

let logger = new Logger('Server');

export default class ElastalertServer {
  private _wss?: WebSocket.Server;
  private _runningTimeouts: NodeJS.Timeout[];

  private _processService: ProcessService;
  private _rulesService: RulesService;
  private _templatesService: TemplatesService;
  private _testService: TestService;

  private _runningServer: ServerType | null;
  private _fileSystemService: FileSystemService;

  constructor() {
    this._runningTimeouts = [];

    this._processService = new ProcessService();
    this._rulesService = new RulesService();
    this._templatesService = new TemplatesService();
    this._testService = new TestService(this);

    this._runningServer = null;
    this._fileSystemService = new FileSystemService();


    // Set listener on process exit (SIGINT == ^C)
    process.on('SIGINT', () => {
      logger.info('Received signal: SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Received signal: SIGTERM');
      process.exit(0);
    });

    process.on('exit', () => {
      logger.info('Stopping server');
      this.stop();
      logger.info('Server stopped. Bye!');
    });
  }

  get processService() {
    return this._processService;
  }

  get rulesService() {
    return this._rulesService;
  }

  get templatesService() {
    return this._templatesService;
  }

  get testService() {
    return this._testService;
  }

  async start() {
    const self = this;

    try {
      const app = createApp(self);

      self._runningServer = serve({ fetch: app.fetch, port: config.get().port }, () => {
        logger.info('Server started');
      });
      self._runningServer.on('error', (error) => {
        logger.error('HTTP server failed with error:', error);
        process.exit(1);
      });

      self._processService.start();
      self._processService.onExit(function() {
        // If the elastalert process exits, we should stop the server.
        process.exit(0);
      });

      try {
        await self._fileSystemService.createDirectoryIfNotExists(self.getDataFolder());
      }
      catch (ex) {
        logger.error('Error creating data folder with error:', ex);
        throw ex;
      }

      logger.info('Server listening on port ' + config.get().port);

      self._wss = listenTestWebSocket(config.get().wsport, self._testService);

      logger.info('Websocket listening on port ' + config.get().wsport);
    }
    catch (error) {
      logger.error('Starting server failed with error:', error);
      process.exit(1);
    }
  }

  stop() {
    this._processService?.stop();
    this._runningServer?.close();
    this._wss?.close();

    this._runningTimeouts.forEach((timeout) => clearTimeout(timeout));
  }

  getDataFolder() {
    const dataFolderSettings = config.get().dataPath;

    if (dataFolderSettings.relative) {
      return path.join(config.get().elastalertPath, dataFolderSettings.path);
    } else {
      return dataFolderSettings.path;
    }
  }

}
