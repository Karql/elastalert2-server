import { join as joinPath, normalize as normalizePath, extname as pathExtension } from 'path';
import mkdirp from 'mkdirp';
import FileSystem from '../../common/file-system/file-system';
import config from '../../common/config';
import Logger from '../../common/logger';
import {
  RuleNotFoundError, RuleNotReadableError, RuleNotWritableError,
  RulesFolderNotFoundError, RulesRootFolderNotCreatableError
} from '../../common/errors/rule_request_errors';
import RequestError from '../../common/errors/request_error';

let logger = new Logger('RulesController');

export default class RulesController {
  private _fileSystemController: FileSystem;
  private _rulesFolder: string;

  constructor() {
    this._fileSystemController = new FileSystem();
    this._rulesFolder = this._getRulesFolder();
  }

  getRules(path: string): Promise<{ rules: string[]}> {
    const self = this;
    const fullPath = joinPath(self._rulesFolder, path);

    return new Promise(function(resolve, reject) {
      self._fileSystemController.readDirectory(fullPath)
        .then(function(directoryIndex) {
          let rules = directoryIndex.files
            .filter(fileName => pathExtension(fileName).toLowerCase() === '.yaml')
            .map(fileName => fileName.slice(0, -5));

          resolve({rules: rules}); // TODO: flat model?
        })
        .catch(function(error) {
          // Check if the requested folder is the rules root folder
          if (normalizePath(self._rulesFolder) === fullPath) {
            // Try to create the root folder
            mkdirp(fullPath)
              .then(() => resolve({rules: []}))
              .catch(() => {
                logger.warn(`The rules root folder (${fullPath}) couldn't be found nor could it be created by the file system.`);
                reject(new RulesRootFolderNotCreatableError());
              });          
          } else {
            logger.warn(`The requested folder (${fullPath}) couldn't be found / read by the server. Error:`, error);
            reject(new RulesFolderNotFoundError(path));
          }
        });
    });
  }

  // TODO: refactor split to methods
  rule(id: string): Promise<{ get(): Promise<string>, edit(body: string): Promise<void>, delete(): Promise<void>  }> {
    const self = this;
    return new Promise(function(resolve, reject) {
      self._findRule(id)
        .then(function(access) {
          console.log('rule resolved');
          resolve({
            get: function() {
              if (access.read) {
                return self._getRule(id);
              }
              return self._getErrorPromise<string>(new RuleNotReadableError(id));
            },
            edit: function(body: string) {
              if (access.write) {
                return self._editRule(id, body);
              }
              return self._getErrorPromise<void>(new RuleNotWritableError(id));
            },
            delete: function() {
              return self._deleteRule(id);
            }
          });
        })
        .catch(function() {
          console.log('catched');
          reject(new RuleNotFoundError(id));
        });
    });
  }

  createRule(id: string, content: string) {
    return this._editRule(id, content);
  }

  _findRule(id: string): Promise<{read: boolean, write: boolean}> {
    let fileName = id + '.yaml';
    const self = this;

    return new Promise(function(resolve, reject) {
      self._fileSystemController.fileExists(joinPath(self._rulesFolder, fileName))
        .then(function(exists) {
          if (!exists) {
            reject();
          } else {
            //TODO: Get real permissions
            //resolve(permissions);
            resolve({
              read: true,
              write: true
            });
          }
        })
        .catch(function(error) {
          reject(error);
        });
    });
  }

  _getRule(id: string) {
    const path = joinPath(this._rulesFolder, id + '.yaml');
    return this._fileSystemController.readFile(path);
  }

  _editRule(id: string, body: string) {
    const path = joinPath(this._rulesFolder, id + '.yaml');
    return this._fileSystemController.writeFile(path, body);
  }

  _deleteRule(id: string) {
    const path = joinPath(this._rulesFolder, id + '.yaml');
    return this._fileSystemController.deleteFile(path);
  }

  _getErrorPromise<T>(error: RequestError) {
    return new Promise<T>(function(resolve, reject) {
      reject(error);
    });
  }

  _getRulesFolder(): string {
    const ruleFolderSettings = config.get().rulesPath;

    if (ruleFolderSettings.relative) {
      return joinPath(config.get().elastalertPath, ruleFolderSettings.path);
    } else {
      return ruleFolderSettings.path;
    }
  }
}
