import path from 'path';
import type { ConfigPath } from './config.schema';
import { config } from './config.service';

/** Absolute path of a folder from the config (`rulesPath`, `templatesPath`, `dataPath`) */
export function resolveConfigPath(folder: ConfigPath): string {
  return folder.relative ? path.join(config.get().elastalertPath, folder.path) : folder.path;
}
