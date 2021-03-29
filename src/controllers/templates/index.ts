import {join as joinPath, normalize as normalizePath, extname as pathExtension} from 'path';
import mkdirp from 'mkdirp';
import FileSystem from '../../common/file-system/file-system';
import config from '../../common/config';
import Logger from '../../common/logger';
import {TemplateNotFoundError, TemplateNotReadableError, TemplateNotWritableError,
  TemplatesFolderNotFoundError, TemplatesRootFolderNotCreatableError} from '../../common/errors/template_request_errors';
import RequestError from '../../common/errors/request_error';

let logger = new Logger('TemplatesController');

export default class TemplatesController {
  private _fileSystemController: FileSystem;
  private _templatesFolder: string;

  constructor() {
    this._fileSystemController = new FileSystem();
    this._templatesFolder = this._getTemplatesFolder();
  }

  getTemplates(path: string): Promise<{ templates: string[ ]}> {
    const self = this;
    const fullPath = joinPath(self._templatesFolder, path);
    return new Promise(function (resolve, reject) {
      self._fileSystemController.readDirectory(fullPath)
        .then(function (directoryIndex) {

          let templates = directoryIndex.files
            .filter((fileName) =>pathExtension(fileName).toLowerCase() === '.yaml')
            .map((fileName) => fileName.slice(0, -5));

          resolve({templates: templates});
        })
        .catch(function (error) {

          // Check if the requested folder is the templates root folder
          if (normalizePath(self._templatesFolder) === fullPath) {

            // Try to create the root folder
            mkdirp(fullPath)
              .then(() => resolve({templates: []}))
              .catch(() => {
                reject(new TemplatesRootFolderNotCreatableError());
                logger.warn(`The templates root folder (${fullPath}) couldn't be found nor could it be created by the file system.`);
              });
          } else {
            logger.warn(`The requested folder (${fullPath}) couldn't be found / read by the server. Error:`, error);
            reject(new TemplatesFolderNotFoundError(path));
          }
        });
    });
  }

  // TODO: refactor split to methods
  template(id: string): Promise<{ get(): Promise<string>, edit(body: string): Promise<void>, delete(): Promise<void>  }> {
    const self = this;
    return new Promise(function (resolve, reject) {
      self._findTemplate(id)
        .then(function (access) {
          console.log('template resolved');
          resolve({
            get: function () {
              if (access.read) {
                return self._getTemplate(id);
              }
              return self._getErrorPromise<string>(new TemplateNotReadableError(id));
            },
            edit: function (body: string) {
              if (access.write) {
                return self._editTemplate(id, body);
              }
              return self._getErrorPromise<void>(new TemplateNotWritableError(id));
            },
            delete: function () {
              return self._deleteTemplate(id);
            }
          });
        })
        .catch(function () {
          console.log('catched');
          reject(new TemplateNotFoundError(id));
        });
    });
  }

  createTemplate(id: string, content: string) {
    return this._editTemplate(id, content);
  }

  _findTemplate(id: string): Promise<{read: boolean, write: boolean}> {
    let fileName = id + '.yaml';
    const self = this;
    return new Promise(function (resolve, reject) {
      self._fileSystemController.fileExists(joinPath(self._templatesFolder, fileName))
        .then(function (exists) {
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
        .catch(function (error) {
          reject(error);
        });
    });
  }

  _getTemplate(id: string) {
    const path = joinPath(this._templatesFolder, id + '.yaml');
    return this._fileSystemController.readFile(path);
  }

  _editTemplate(id: string, body: string) {
    const path = joinPath(this._templatesFolder, id + '.yaml');
    return this._fileSystemController.writeFile(path, body);
  }

  _deleteTemplate(id: string) {
    const path = joinPath(this._templatesFolder, id + '.yaml');
    return this._fileSystemController.deleteFile(path);
  }

  _getErrorPromise<T>(error: RequestError) {
    return new Promise<T>(function (resolve, reject) {
      reject(error);
    });
  }

  _getTemplatesFolder() {
    const templateFolderSettings = config.get().templatesPath;

    if (templateFolderSettings.relative) {
      return joinPath(config.get().elastalertPath, templateFolderSettings.path);
    } else {
      return templateFolderSettings.path;
    }
  }
}
