import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { Config, configSchema, deprecatedConfigKeys } from './config.schema';
import Logger from '../logger/logger';
import { configureLogging } from '../logger/logging';

// Config files relative to the working directory, config.dev.json takes precedence (for local development)
const devConfigPath = path.join(process.cwd(), 'config/config.dev.json');
const configPath = path.join(process.cwd(), 'config/config.json');

const logger = new Logger('Config');

export default class ConfigService {
  private static instance?: ConfigService;

  private config?: Config;

  private constructor() {}

  static getInstance(): ConfigService {
    ConfigService.instance ??= new ConfigService();

    return ConfigService.instance;
  }

  get(): Config {
    if (!this.config) {
      throw new Error('Config not loaded, call config.load() first');
    }

    return this.config;
  }

  /**
   * Reads `config/config.dev.json` or `config/config.json` (defaults when neither exists) and applies
   * the logging options. Exits the process when the config file is invalid.
   */
  async load(): Promise<void> {
    this.config = await this.readConfig();

    configureLogging({ ...this.config.logging, serverName: this.config.appName });
  }

  private async readConfig(): Promise<Config> {
    const file = await this.findConfigFile();

    if (!file) {
      logger.info('No config file found, using the default config.');
      return configSchema.parse({});
    }

    logger.info(`Using config file ${file}`);

    try {
      const config: unknown = JSON.parse(await fs.promises.readFile(file, 'utf8'));

      this.removeDeprecatedKeys(config);

      const result = configSchema.safeParse(config);

      if (!result.success) {
        throw new Error('\n' + z.prettifyError(result.error));
      }

      return result.data;
    } catch (error) {
      logger.error(`Invalid config file: ${file}, exception: ${error}`);
      process.exit(1);
    }
  }

  /** First readable config file, unreadable files are skipped with a warning */
  private async findConfigFile(): Promise<string | undefined> {
    for (const file of [devConfigPath, configPath]) {
      try {
        await fs.promises.access(file, fs.constants.R_OK);
        return file;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;

        if (code !== 'ENOENT') {
          logger.warn(`Config file ${file} can't be read (${code}), skipping it.`);
        }
      }
    }

    return undefined;
  }

  /**
   * Removes deprecated options from the parsed config file and warns about them.
   * Values are not logged, they may contain credentials.
   */
  private removeDeprecatedKeys(config: unknown) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return;
    }

    const found = deprecatedConfigKeys.filter((key) => key in config);

    if (found.length > 0) {
      logger.warn(`Config options ${found.join(', ')} are deprecated and ignored (the Elasticsearch endpoints were removed in 6.0.0). Remove them from the config file.`);
      found.forEach((key) => delete (config as Record<string, unknown>)[key]);
    }
  }
}

/** Config singleton, call `config.load()` once at startup */
export const config = ConfigService.getInstance();
