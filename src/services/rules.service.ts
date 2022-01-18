import { join as joinPath, normalize as normalizePath, extname as pathExtension } from 'path';
import mkdirp from 'mkdirp';
import FileSystemService from '../common/file-system/file-system.service';
import config from '../common/config';
import Logger from '../common/logger';
import {
  RuleNotFoundError, RuleNotReadableError, RuleNotWritableError,
  RulesFolderNotFoundError, RulesRootFolderNotCreatableError
} from '../common/errors/rule_request_errors';
import RequestError from '../common/errors/request_error';

let logger = new Logger('RulesService');

export default class RulesService {
  private fileSystemController: FileSystemService;
  private rulesFolder: string;

  constructor() {
    this.fileSystemController = new FileSystemService();
    this.rulesFolder = this.getRulesFolder();
  }

  public async getRules(path: string): Promise<{ rules: string[]}> {
    const self = this;
    const fullPath = joinPath(self.rulesFolder, path);

    try {
      let directoryIndex = await this.fileSystemController.readDirectory(fullPath);
      let rules = directoryIndex.files
            .filter(fileName => pathExtension(fileName).toLowerCase() === '.yaml')
            .map(fileName => fileName.slice(0, -5));

      return {rules: rules};
    }
    catch(error) {
      if (normalizePath(self.rulesFolder) === fullPath) {
        // Try to create the root folder

        try {
          mkdirp(fullPath);
          return {rules: []};
        }

        catch(error) {
          logger.warn(`The rules root folder (${fullPath}) couldn't be found nor could it be created by the file system.`, error);
          throw new RulesRootFolderNotCreatableError();
        }
      }
      else {
        logger.warn(`The requested folder (${fullPath}) couldn't be found / read by the server. Error:`, error);
        throw new RulesFolderNotFoundError(path);
      }
    }
  }

  // TODO: refactor split to methods
  public async rule(id: string): Promise<{ get(): Promise<string>, edit(body: string): Promise<void>, delete(): Promise<void>  }> {
    const self = this;

    let access = await self.findRule(id);

    return {
      get: async () => {
        if (access.read) {
          return await self.getRule(id);
        }
        throw new RuleNotReadableError(id);
      },
      edit: async (body: string) => {
        if (access.write) {
          return self.editRule(id, body);
        }
        throw new RuleNotWritableError(id);
      },
      delete: async() => {
        await self.deleteRule(id);
      }
    }
  }

  public createRule(id: string, content: string) {
    return this.editRule(id, content);
  }

  private async findRule(id: string): Promise<{read: boolean, write: boolean}> {
    let fileName = id + '.yaml';
    const self = this;

    let exists = await this.fileSystemController.fileExists(joinPath(self.rulesFolder, fileName));

    if (!exists) {
      throw new RuleNotFoundError(id);
    }

    //TODO: Get real permissions
    return {
      read: true,
      write: true
    };
  }

  private getRule(id: string) {
    const path = joinPath(this.rulesFolder, id + '.yaml');
    return this.fileSystemController.readFile(path);
  }

  private editRule(id: string, body: string) {
    const path = joinPath(this.rulesFolder, id + '.yaml');
    return this.fileSystemController.writeFile(path, body);
  }

  private deleteRule(id: string) {
    const path = joinPath(this.rulesFolder, id + '.yaml');
    return this.fileSystemController.deleteFile(path);
  }

  private getRulesFolder(): string {
    const ruleFolderSettings = config.get().rulesPath;

    if (ruleFolderSettings.relative) {
      return joinPath(config.get().elastalertPath, ruleFolderSettings.path);
    } else {
      return ruleFolderSettings.path;
    }
  }
}
