import fs from 'fs';
import { join as joinPath } from 'path';
import mkdirp from 'mkdirp';
import { DirectoryIndex } from './directory-index.model';

export default class FileSystemService {
  constructor() { }

  readDirectory(path: string): Promise<DirectoryIndex> {
    const self = this;
    return new Promise(function (resolve, reject) {
      try {
        fs.readdir(path, function (error, elements) {
          if (error) {
            reject(error);
          } else {
            let statCount = 0;
            let directoryIndex = self.getEmptyDirectoryIndex();

            if (elements.length == 0) {
              resolve(directoryIndex);
            }

            elements.forEach(function (element) {
              fs.stat(joinPath(path, element), function (error, stats) {
                if (stats.isDirectory()) {
                  directoryIndex.directories.push(element);
                } else if (stats.isFile()) {
                  directoryIndex.files.push(element);
                }

                statCount++;
                if (statCount === elements.length) {
                  resolve(directoryIndex);
                }
              });
            });
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  directoryExists(path: string) {
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

  readFile(path: string): Promise<string> {
    return new Promise(function (resolve, reject) {
      fs.readFile(path, 'utf8', function (error, content) {
        error ? reject(error) : resolve(content);
      });
    });
  }

  writeFile(path: string, content = ''): Promise<void> {
    return new Promise<void>(function (resolve, reject) {
      try {
        fs.writeFile(path, content, function (error) {
          error ? reject(error) : resolve();
        });
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  }

  deleteFile(path: string): Promise<void> {
    return new Promise<void>(function (resolve, reject) {
      fs.unlink(path, function (error) {
        error ? reject(error) : resolve();
      });
    });
  }

  getEmptyDirectoryIndex(): DirectoryIndex {
    return {
      directories: [],
      files: []
    };
  }

  _exists(path: string) {
    return new Promise(function (resolve, reject) {
      try {
        fs.access(path, fs.constants.F_OK, function (error) {
          error ? resolve(false) : resolve(true);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
