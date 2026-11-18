import { config } from '../../shared/config/config.service';
import { resolveConfigPath } from '../../shared/config/config-path';
import YamlFileStore from '../../shared/file-system/yaml-file-store';
import Logger from '../../shared/logger/logger';
import {
  TemplateNotFoundError, TemplateNotReadableError, TemplateNotWritableError,
  TemplatesFolderNotFoundError, TemplatesRootFolderNotCreatableError,
} from './templates.errors';

/** Rule template files (`<id>.yaml`) in the `templatesPath` folder */
export default class TemplatesService extends YamlFileStore {
  constructor() {
    super(resolveConfigPath(config.get().templatesPath), {
      notFound: (id) => new TemplateNotFoundError(id),
      notReadable: (id) => new TemplateNotReadableError(id),
      notWritable: (id) => new TemplateNotWritableError(id),
      folderNotFound: (folder) => new TemplatesFolderNotFoundError(folder),
      rootFolderNotCreatable: () => new TemplatesRootFolderNotCreatableError(),
    }, new Logger('TemplatesService'));
  }
}
