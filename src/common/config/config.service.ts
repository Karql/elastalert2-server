import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import schema from './schema';
import Logger from '../logger';
import { Config } from './config.model';

// Config file relative from project root
const configFile = 'config/config.json';
const devConfigFile = 'config/config.dev.json';

const configPath = path.join(process.cwd(), configFile);
const devConfigPath = path.join(process.cwd(), devConfigFile);
const logger = new Logger('Config');

export default class ConfigService {
  private static _instance: ConfigService;

  private _config?: Config;

  private constructor() {

  }

  public static getInstance(): ConfigService {
    if (!this._instance) {
      this._instance = new ConfigService();
    }

    return this._instance;
  }

  get(): Config {
    if (!this._config) {
      throw new Error('Config not set')
    }

    return this._config;
  }

  /**
   * Loads the config by reading the config file or falling back to defaults.
   *
   * @returns {Promise} Returns a promise which resolves when everything is done (as a promise would).
   */
  async load(): Promise<void> {
    //TODO: Watch config file for changes and reload
    this._config = await this._getConfig();
  }

  async _getConfig(): Promise<Config> {
    let configFilePath: string;

    if (await this._fileExists(devConfigPath))
    {
      logger.info('Found dev config file.');
      configFilePath = devConfigPath;
    }

    else if (await this._fileExists(configPath))
    {
      logger.info('Found config file.');
      configFilePath = configPath;
    }

    else {
      logger.info('Using default config.');
      return schema.parse({});
    }

    try
    {
      let configJson = await this._readFile(configFilePath);
      let config = JSON.parse(configJson);

      let validationResult = schema.safeParse(config);

      if (!validationResult.success) {
        throw new Error('\n' + z.prettifyError(validationResult.error));
      }

      return validationResult.data;
    }

    catch (e) {
      logger.error(`Invalid config file: ${configFilePath}, exception: ${e}`); 
      process.exit(1); // TODO: when watching changes move to load and don't crash process
    }
  }

  /**
   * Checks if the config file exists and we have reading permissions
   *
   * @returns {Promise} Promise returning true if the file was found and false otherwise.
   * @private
   */
  _fileExists(filePath: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      // Check if the config file exists and has reading permissions
      try {
        fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK, function (error) {
          if (error) {
            if (error.code === 'ENOENT') {
              logger.info(`No ${path.basename(filePath)} file was found in ${filePath}.`);
            } else {
              logger.warn(`${filePath} can't be read because of reading permission problems. Falling back to default configuration.`);
            }
            resolve(false);
          } else {
            logger.info(`A config file was found in ${filePath}. Using that config.`);
            resolve(true);
          }
        });
      } catch (error) {
        logger.error('Error getting access information with fs using `fs.access`. Error:', error);
        // TODO: deadlock here?
      }
    });
  }

  /**
   * Reads the config file.
   *
   * @returns {Promise} Promise returning the config if successfully read. Rejects if reading the config failed.
   * @private
   */
  _readFile(file: string) {
    return new Promise<string>(function (resolve, reject) {
      fs.readFile(file, 'utf8', function (error, config) {
        if (error) {
          logger.warn(`Unable to read config file in (${file}). Using default configuration. Error: `, error);
          reject();
        } else {
          resolve(config);
        }
      });
    });
  }
}
