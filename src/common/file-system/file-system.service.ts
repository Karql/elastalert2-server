import fs, { read } from 'fs';
import { join as joinPath } from 'path';
import { mkdirp } from 'mkdirp';
import { DirectoryIndex } from './directory-index.model';

export default class FileSystemService {
  constructor() { }

  async readDirectory(path: string): Promise<DirectoryIndex> {
    const self = this;

    let elements = await fs.promises.readdir(path);
    let directoryIndex = self.getEmptyDirectoryIndex();

    for(let element of elements)
    {
      let stats = await fs.promises.stat(joinPath(path, element));

      if (stats.isDirectory()) {
        directoryIndex.directories.push(element);
      } else if (stats.isFile()) {
        directoryIndex.files.push(element);
      }
    }

    return directoryIndex;
  }

  directoryExists(path: string): Promise<boolean> {
    return this._exists(path);
  }

  /**
   *
   * @param path
   * @returns Promise resolves to first directory made that had to be created, or undefined if everything already exists. Promise rejects if any errors are encountered. Note that, in the case of promise rejection, some directories may have been created, as recursive directory creation is not an atomic operation.
   */
  createDirectoryIfNotExists(path: string): Promise<string | unknown> {
    return mkdirp(path);
  }

  /*deleteDirectory(path) {

  }*/

  fileExists(path: string) {
    return this._exists(path);
  }

  async readFile(path: string): Promise<string> {
    return await fs.promises.readFile(path, 'utf8');
  }

  async writeFile(path: string, content = ''): Promise<void> {
    await fs.promises.writeFile(path, content)
  }

  async deleteFile(path: string): Promise<void> {
    fs.promises.unlink(path);
  }

  getEmptyDirectoryIndex(): DirectoryIndex {
    return {
      directories: [],
      files: []
    };
  }

  async _exists(path: string): Promise<boolean> {
    try {
      await fs.promises.access(path, fs.constants.F_OK);
      return true;
    }

    catch {
      return false;
    }
  }
}
