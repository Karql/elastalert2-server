import { join as joinPath, normalize as normalizePath, extname as pathExtension } from 'path';
import { mkdirp } from 'mkdirp';
import FileSystemService from '../common/file-system/file-system.service';
import config from '../common/config';
import Logger from '../common/logger';
import {
  TemplateNotFoundError, TemplateNotReadableError, TemplateNotWritableError,
  TemplatesFolderNotFoundError, TemplatesRootFolderNotCreatableError
} from '../common/errors/template_request_errors';
import RequestError from '../common/errors/request_error';

let logger = new Logger('TemplatesService');

export default class TemplatesService {
  private fileSystemController: FileSystemService;
  private templatesFolder: string;

  constructor() {
    this.fileSystemController = new FileSystemService();
    this.templatesFolder = this.getTemplatesFolder();
  }

  public async getTemplates(path: string): Promise<{ templates: string[] }> {
    const self = this;
    const fullPath = joinPath(self.templatesFolder, path);

    try {
      let directoryIndex = await this.fileSystemController.readDirectory(fullPath);
      let templates = directoryIndex.files
        .filter((fileName) => pathExtension(fileName).toLowerCase() === '.yaml')
        .map((fileName) => fileName.slice(0, -5));

      return { templates: templates };
    }
    catch (error) {
      // Check if the requested folder is the templates root folder
      if (normalizePath(self.templatesFolder) === fullPath
          && !this.fileSystemController.directoryExists(fullPath)) {
        // Try to create the root folder
        try {
          await mkdirp(fullPath);
          return { templates: [] };
        }
        catch (error) {
          logger.warn(`The templates root folder (${fullPath}) couldn't be found nor could it be created by the file system.`);
          throw new TemplatesRootFolderNotCreatableError();
        }
      }
      else {
        logger.warn(`The requested folder (${fullPath}) couldn't be found / read by the server. Error:`, error);
        throw new TemplatesFolderNotFoundError(path);
      }
    }
  }

  // TODO: refactor split to methods
  public async template(id: string): Promise<{ get(): Promise<string>, edit(body: string): Promise<void>, delete(): Promise<void> }> {
    const self = this;

    let access = await self.findTemplate(id);

    return {
      get: () => {
        if (access.read) {
          return self.getTemplate(id);
        }
        throw new TemplateNotReadableError(id);
      },
      edit: (body: string) => {
        if (access.write) {
          return self.editTemplate(id, body);
        }
        throw new TemplateNotWritableError(id);
      },
      delete: () => {
        return self.deleteTemplate(id);
      }
    };
  }

  public createTemplate(id: string, content: string) {
    return this.editTemplate(id, content);
  }

  private async findTemplate(id: string): Promise<{ read: boolean, write: boolean }> {
    let fileName = id + '.yaml';

    let exists = await this.fileSystemController.fileExists(joinPath(this.templatesFolder, fileName));

    if (!exists) {
      throw new TemplateNotFoundError(id);
    }

    //TODO: Get real permissions
    return {
      read: true,
      write: true
    };
  }

  private getTemplate(id: string) {
    const path = joinPath(this.templatesFolder, id + '.yaml');
    return this.fileSystemController.readFile(path);
  }

  private editTemplate(id: string, body: string) {
    const path = joinPath(this.templatesFolder, id + '.yaml');
    return this.fileSystemController.writeFile(path, body);
  }

  private deleteTemplate(id: string) {
    const path = joinPath(this.templatesFolder, id + '.yaml');
    return this.fileSystemController.deleteFile(path);
  }

  private getTemplatesFolder() {
    const templateFolderSettings = config.get().templatesPath;

    if (templateFolderSettings.relative) {
      return joinPath(config.get().elastalertPath, templateFolderSettings.path);
    }
    else {
      return templateFolderSettings.path;
    }
  }
}
