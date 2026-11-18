import fs from 'fs';
import path from 'path';
import { mkdirp } from 'mkdirp';
import type RequestError from '../errors/request-error';
import type Logger from '../logger/logger';
import FileSystemService from './file-system.service';

const YAML_EXTENSION = '.yaml';

/** Request errors returned by a store, e.g. `RuleNotFoundError` for rules */
export interface YamlFileStoreErrors {
  notFound(id: string): RequestError;
  notReadable(id: string): RequestError;
  notWritable(id: string): RequestError;
  folderNotFound(folder: string): RequestError;
  rootFolderNotCreatable(): RequestError;
}

/**
 * `.yaml` files in one folder (rules, rule templates), addressed by id: the file path relative
 * to the folder without the extension, e.g. `my_rule` or `team/my_rule`.
 *
 * Ids and folder paths must stay inside the folder: `../config` is reported as not found.
 */
export default class YamlFileStore {
  private readonly root: string;
  private readonly fileSystem = new FileSystemService();

  constructor(
    folder: string,
    private readonly errors: YamlFileStoreErrors,
    private readonly logger: Logger,
  ) {
    this.root = path.resolve(folder);
  }

  /** Ids of files directly in the given subfolder (`''` is the root folder, created when missing) */
  async list(folder = ''): Promise<string[]> {
    const fullPath = this.resolve(folder, () => this.errors.folderNotFound(folder));

    try {
      // Follows symlinks, e.g. files mounted from a Kubernetes ConfigMap
      const { files } = await this.fileSystem.readDirectory(fullPath);

      return files
        .filter((fileName) => path.extname(fileName).toLowerCase() === YAML_EXTENSION)
        .map((fileName) => fileName.slice(0, -YAML_EXTENSION.length));
    } catch (error) {
      if (fullPath === this.root && errorCode(error) === 'ENOENT') {
        return this.createRoot();
      }

      this.logger.warn(`The requested folder (${fullPath}) couldn't be found / read by the server. Error:`, error);
      throw this.errors.folderNotFound(folder);
    }
  }

  async get(id: string): Promise<string> {
    try {
      return await fs.promises.readFile(this.filePath(id), 'utf8');
    } catch (error) {
      throw this.toRequestError(error, id, 'read');
    }
  }

  /** Creates or replaces the file */
  async save(id: string, content: string): Promise<void> {
    try {
      await fs.promises.writeFile(this.filePath(id), content);
    } catch (error) {
      throw this.toRequestError(error, id, 'write');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await fs.promises.unlink(this.filePath(id));
    } catch (error) {
      throw this.toRequestError(error, id, 'delete');
    }
  }

  private filePath(id: string): string {
    return this.resolve(id + YAML_EXTENSION, () => this.errors.notFound(id));
  }

  /** Absolute path inside the root folder; throws `outside()` for paths escaping it (`..`, absolute paths) */
  private resolve(relativePath: string, outside: () => RequestError): string {
    const fullPath = path.resolve(this.root, relativePath);

    if (fullPath !== this.root && !fullPath.startsWith(this.root + path.sep)) {
      throw outside();
    }

    return fullPath;
  }

  private async createRoot(): Promise<string[]> {
    try {
      await mkdirp(this.root);
      return [];
    } catch (error) {
      this.logger.warn(`The root folder (${this.root}) couldn't be found nor could it be created by the file system.`, error);
      throw this.errors.rootFolderNotCreatable();
    }
  }

  private toRequestError(error: unknown, id: string, access: 'read' | 'write' | 'delete'): unknown {
    switch (errorCode(error)) {
      case 'ENOENT':
        // Writing fails with ENOENT when the subfolder doesn't exist
        return access === 'write' ? this.errors.folderNotFound(path.dirname(id)) : this.errors.notFound(id);
      case 'EISDIR':
        return this.errors.notFound(id);
      case 'EACCES':
      case 'EPERM':
        return access === 'read' ? this.errors.notReadable(id) : this.errors.notWritable(id);
      default:
        return error;
    }
  }
}

function errorCode(error: unknown): string | undefined {
  return (error as NodeJS.ErrnoException | undefined)?.code;
}
