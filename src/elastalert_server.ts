import express, { Express,   Response as ExResponse,
  Request as ExRequest,
  NextFunction,} from 'express';
import WebSocket from 'ws';
import bodyParser from 'body-parser';
import Logger from './common/logger';
import config from './common/config';
import path from 'path';
import FileSystemService from './common/file-system/file-system.service';
import { listen } from './common/websocket';
import ProcessService from './services/process.service';
import RulesService from './services/rules.service';
import TemplatesService from './services/templates.service';
import TestService from './services/test.service';
import cors from 'cors';
import { Server } from 'http';
import swaggerUi from "swagger-ui-express";

import { RegisterRoutes } from './routes'
import RequestError from './common/errors/request_error';

let logger = new Logger('Server');

export default class ElastalertServer {
  private _express: Express;
  private _wss?: WebSocket.Server;
  private _runningTimeouts: NodeJS.Timeout[];

  private _processService: ProcessService;
  private _rulesService: RulesService;
  private _templatesService: TemplatesService;
  private _testService: TestService;

  private _runningServer: Server | null;
  private _fileSystemService: FileSystemService;

  constructor() {
    this._express = express();

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

  get express() {
    return this._express;
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
      self._express.use(cors());
      self._express.use(express.json());
      self._express.use(express.urlencoded({ extended: true }));

      // TODO
      self._express.use(express.static("dist"));
      self._express.use(
        "/swagger-ui",
        swaggerUi.serve,
        swaggerUi.setup(undefined, {
          swaggerOptions: {
            url: "/swagger.json",
          },
        })
      );


      self._setupRouter();

      self._express.use((err: unknown,
        req: ExRequest,
        res: ExResponse,
        next: NextFunction) => {
          if (err instanceof RequestError) {
            let requestError = <RequestError>err;
            return res.status(requestError.statusCode || 500).json(requestError);
          }

          // TODO: Not send?
          if (err instanceof Error) {
            return res.status(500).json({
              error: err
            });
          }

          next();
      })



      self._runningServer = self.express.listen(config.get().port, self._serverController);
      self._express.set('server', self);


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

      // self._fileSystemController.createDirectoryIfNotExists(self.getDataFolder())
      // .catch(function (error) {
      //   logger.error('Error creating data folder with error:', error);
      // });

      logger.info('Server listening on port ' + config.get().port);

      self._wss = listen(config.get().wsport);

      self._wss.on('connection', (ws) => {
        ws.on('message', (message) => {
          try {
            let data = JSON.parse(message.toString());
            if (data.rule) {
              let rule = data.rule;
              let options = data.options;
              // TODO: joi validate options
              self._testService?.testRule(rule, options, ws);
            }
          } catch (error) {
            logger.error('Failed to test rule with error:', error);
          }
        });
      });

      logger.info('Websocket listening on port 3333');
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

  _setupRouter() {
    RegisterRoutes(this._express);
  }

  _serverController() {
    logger.info('Server started');
  }
}
