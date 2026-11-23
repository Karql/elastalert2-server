import fs from 'fs';
import { join as joinPath } from 'path';
import { mkdirp } from 'mkdirp';
import { DirectoryIndex } from './directory-index';

export default class FileSystemService {
  /** Names of files and directories in the folder (follows symlinks, e.g. files mounted from a Kubernetes ConfigMap) */
  async readDirectory(path: string): Promise<DirectoryIndex> {
    const directoryIndex: DirectoryIndex = { directories: [], files: [] };

    for (const element of await fs.promises.readdir(path)) {
      const stats = await fs.promises.stat(joinPath(path, element));

      if (stats.isDirectory()) {
        directoryIndex.directories.push(element);
      } else if (stats.isFile()) {
        directoryIndex.files.push(element);
      }
    }

    return directoryIndex;
  }

  /** Creates the folder with missing parents, does nothing when it already exists */
  async createDirectoryIfNotExists(path: string): Promise<void> {
    await mkdirp(path);
  }

  async writeFile(path: string, content = ''): Promise<void> {
    await fs.promises.writeFile(path, content);
  }
}
