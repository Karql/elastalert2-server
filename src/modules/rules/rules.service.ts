import { config } from '../../shared/config/config.service';
import { resolveConfigPath } from '../../shared/config/config-path';
import YamlFileStore from '../../shared/file-system/yaml-file-store';
import Logger from '../../shared/logger/logger';
import {
  RuleNotFoundError, RuleNotReadableError, RuleNotWritableError,
  RulesFolderNotFoundError, RulesRootFolderNotCreatableError,
} from './rules.errors';

/** Rule files (`<id>.yaml`) in the `rulesPath` folder */
export default class RulesService extends YamlFileStore {
  constructor() {
    super(resolveConfigPath(config.get().rulesPath), {
      notFound: (id) => new RuleNotFoundError(id),
      notReadable: (id) => new RuleNotReadableError(id),
      notWritable: (id) => new RuleNotWritableError(id),
      folderNotFound: (folder) => new RulesFolderNotFoundError(folder),
      rootFolderNotCreatable: () => new RulesRootFolderNotCreatableError(),
    }, new Logger('RulesService'));
  }
}
