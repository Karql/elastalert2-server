import express, { Express} from 'express';
import bodyParser from 'body-parser';
import Logger from './common/logger';
import config from './common/config';
import path from 'path';
import FileSystem from './common/file-system/file-system';
import { listen } from './common/websocket';
import setupRouter from './routes/route_setup';
import ProcessController from './controllers/process';
import RulesController from './controllers/rules';
import TemplatesController from './controllers/templates';
import TestController from './controllers/test';
import cors from 'cors';
import { Server } from 'http';

let logger = new Logger('Server');

export default class ElastalertServer {
  private _express: Express;
  private _runningTimeouts: NodeJS.Timeout[];

  private _processController: ProcessController;
  private _rulesController: RulesController;
  private _templatesController: TemplatesController;
  private _testController: TestController;

  private _runningServer: Server | null; 
  private _fileSystemController: FileSystem;

  constructor() {
    this._express = express();
    
    this._runningTimeouts = [];

    this._processController = new ProcessController();
    this._rulesController = new RulesController();
    this._templatesController = new TemplatesController();
    this._testController = new TestController(this);

    this._runningServer = null;
    this._fileSystemController = new FileSystem();
    

    // Set listener on process exit (SIGINT == ^C)
    process.on('SIGINT', () => {
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

  get processController() {
    return this._processController;
  }

  get rulesController() {
    return this._rulesController;
  }

  get templatesController() {
    return this._templatesController;
  }

  get testController() {
    return this._testController;
  }

  async start() {
    const self = this;
    
    try {
      self._express.use(cors());
      self._express.use(bodyParser.json());
      self._express.use(bodyParser.urlencoded({ extended: true }));
      self._setupRouter();
      self._runningServer = self.express.listen(config.get().port, self._serverController);
      self._express.set('server', self);


      self._processController.start();
      self._processController.onExit(function() {
        // If the elastalert process exits, we should stop the server.
        process.exit(0);
      });

      try {
        await self._fileSystemController.createDirectoryIfNotExists(self.getDataFolder());
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

      let wss = listen(config.get().wsport);

      wss.on('connection', (ws) => {
        ws.on('message', (message) => {
          try {
            let data = JSON.parse(message.toString());
            if (data.rule) {
              let rule = data.rule;
              let options = data.options;
              // TODO: joi validate options
              self._testController?.testRule(rule, options, ws);
            }
          } catch (error) {
            console.log(error);
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
    this._processController?.stop();
    this._runningServer?.close();

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
    setupRouter(this._express);
  }

  _serverController() {
    logger.info('Server started');
  }
}
