1) `elastalert_server.ts` - Object is possibly null (check is vars like _testController are deffined corectly)
2) `server_config.ts` - Added JSON.parse - probably not neede check how it was done before (old joi autoparse to object)
3) `//"precommit": "./node_modules/eslint/bin/eslint.js ."` in package.json
4) `file_system.ts` `getEmptyDirectoryIndex()` - add type
5) `controllers\rules\index.ts` - flat model for rules instead of `{ rules: ["rule1", "rule2"]}`
6) `controllers\templates\index.ts` - flat model for rules instead of `{ templates: ["template1", "template2"]}`
7) `controllers\rules\index.ts` and `controllers\templates\index.ts` are almost the same make base class or something
8) `request_error.ts` data more specify
9) JOI for `TestRuleOptions` or find way to handling defaults
10) `statusHandler` nullable status?
11) Better implement `ConfigService` as singleton and refactor to not using config/index.ts
12) Refactor `rulesController.rule`
13) `metadataHandler` fix `resp.hits.hits.map(h => h._source);`
14) `metadataHandler` fix `getQueryString` -> `(<any>request.query).rule_name)`
15) `scripts/replace_templates.sh` probably not needed
16) Better error handling and documentation - for now global error handling in `elastalert_server.ts` https://tsoa-community.github.io/docs/error-handling.html#setting-up-error-handling
17) Logging requst change RouteLogger to morgan (https://rsbh.dev/blog/rest-api-with-express-typescript)
18) Split logic form metadata.controller.ts to metadata.service.ts 
19) Migrate latest fixes from https://github.com/johnsusek/elastalert-server