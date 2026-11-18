~~1) `server.ts` - Object is possibly null (check is vars like _testController are deffined corectly)~~ (services are created in the constructor, nullable fields use `?.`)
~~2) `server_config.ts` - Added JSON.parse - probably not neede check how it was done before (old joi autoparse to object)~~ (config.json is parsed with JSON.parse and validated by the Zod schema)
~~3) `//"precommit": "./node_modules/eslint/bin/eslint.js ."` in package.json~~
~~4) `file_system.ts` `getEmptyDirectoryIndex()` - add type~~
~~5) `controllers\rules\index.ts` - flat model for rules instead of `{ rules: ["rule1", "rule2"]}`~~ (kept, changing the response contract has no benefit)
~~6) `controllers\templates\index.ts` - flat model for rules instead of `{ templates: ["template1", "template2"]}`~~ (kept, changing the response contract has no benefit)
~~7) `controllers\rules\index.ts` and `controllers\templates\index.ts` are almost the same make base class or something~~ (`YamlFileStore` shared by `RulesService` and `TemplatesService`)
~~8) `request_error.ts` data more specify~~ (errors are Problem Details with typed extensions)
~~9) JOI for `TestRuleOptions` or find way to handling defaults~~ (Zod schema with defaults)
~~10) `statusHandler` nullable status?~~ (status is always set, starts as IDLE)
~~11) Better implement `ConfigService` as singleton and refactor to not using config/index.ts~~ (`ConfigService` is a singleton exported as `config`)
~~12) Refactor `rulesController.rule`~~ (replaced by `get`, `save` and `delete` methods)
~~13) `metadataHandler` fix `resp.hits.hits.map(h => h._source);`~~ (metadata endpoint removed)
~~14) `metadataHandler` fix `getQueryString` -> `(<any>request.query).rule_name)`~~ (metadata endpoint removed)
~~15) `scripts/replace_templates.sh` probably not needed~~
~~16) Better error handling and documentation~~ (`app.onError` in `app.ts`, error responses documented in OpenAPI)
~~17) Logging requst change RouteLogger to morgan / bunyan-middleware~~ (`requestLogger` Hono middleware, pino)
~~18) Split logic form metadata.controller.ts to metadata.service.ts~~ (metadata endpoint removed)
~~19) Migrate latest fixes from https://github.com/johnsusek/elastalert-server~~ (reviewed: the rest are Praeco features, Elasticsearch/OpenSearch client changes or already done here)
~~20) Verify test rule on WS
IMO something is wrong here: e84a3fa8fc79520eaddf701c220d3f92291bb9c9
Last catch in testRule() supresses all errors~~
