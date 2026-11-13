// package.json is outside of rootDir, so it is loaded at runtime (dist/shared -> ../../package.json)
export const packageInfo: {
  name: string;
  version: string;
  description: string;
  license: string;
} = require('../../package.json');
