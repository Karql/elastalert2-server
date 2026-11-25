# ElastAlert2 Server

A server that runs [ElastAlert2](https://github.com/jertel/elastalert2) and exposes a REST API for managing rules and rule templates and for testing rules.

It works great together with the [ElastAlert Kibana plugin](https://github.com/karql/elastalert-kibana-plugin). You can also manage everything directly from Swagger UI 😍 at `/swagger-ui/`.

Docker images are available on [Docker Hub](https://hub.docker.com/r/karql/elastalert2-server).

![GitHub release](https://img.shields.io/github/release/karql/elastalert2-server.svg)
![Docker pulls](https://img.shields.io/docker/pulls/karql/elastalert2-server.svg)
![GitHub stars](https://img.shields.io/github/stars/karql/elastalert2-server.svg?style=social&label=Stars)

## Historical background

This project is a fork of [bitsensor/elastalert](https://github.com/bitsensor/elastalert), Copyright © 2019, BitSensor B.V., which is no longer maintained.

I use and like this project, so I decided to keep developing it:

- [4.0.0](https://github.com/Karql/elastalert2-server/releases/tag/4.0.0) - support for the latest [ElastAlert](https://github.com/Yelp/elastalert) on Python 3
- [5.0.0](https://github.com/Karql/elastalert2-server/releases/tag/5.0.0) - [ElastAlert2](https://github.com/jertel/elastalert2), the maintained successor of ElastAlert, migration to TypeScript and Swagger
- 6.0.0 - [Hono](https://hono.dev) + [Zod](https://zod.dev), Problem Details errors, structured logging (see [CHANGELOG](CHANGELOG.md))

## Versions

| Version | Branch | Status |
|---|---|---|
| 6.x | [`master`](https://github.com/Karql/elastalert2-server/tree/master) | Current version, new features and fixes |
| 5.x | [`v5`](https://github.com/Karql/elastalert2-server/tree/v5) | Security and critical fixes only ([CHANGELOG](https://github.com/Karql/elastalert2-server/blob/v5/CHANGELOG.md)) |

Upgrading from 5.x to 6.x: see the breaking changes of [6.0.0](CHANGELOG.md#600). The most important ones are errors returned as Problem Details, the removed `/metadata`, `/mapping` and `/search` endpoints, the ignored `es_*` options in `config.json`, the new log format and the Docker image without the BitSensor rule templates. Use the [ElastAlert Kibana plugin](https://github.com/karql/elastalert-kibana-plugin) 2.x with 6.x, older versions of the plugin don't show the new error format.

## Installation

The most convenient way to run the server is the Docker image. Clone the repository to get the example configuration files:

```bash
git clone https://github.com/karql/elastalert2-server.git && cd elastalert2-server
```

Set the Elasticsearch connection (`es_host`, `es_port`, ...) in `config/elastalert.yaml` and `config/elastalert-test.yaml`. The default is `localhost:9200`, which inside a container is the container itself, so use the address of your Elasticsearch.

Create the folders for rules and rule templates first, otherwise Docker creates them owned by root and the server (running as user `node`, uid 1000) can't write to them:

```bash
mkdir -p rules rule_templates

docker run -d -p 3030:3030 -p 3333:3333 \
    -v "$(pwd)/config/elastalert.yaml:/opt/elastalert/config.yaml" \
    -v "$(pwd)/config/elastalert-test.yaml:/opt/elastalert/config-test.yaml" \
    -v "$(pwd)/config/config.json:/opt/elastalert-server/config/config.json" \
    -v "$(pwd)/rules:/opt/elastalert/rules" \
    -v "$(pwd)/rule_templates:/opt/elastalert/rule_templates" \
    --name elastalert2-server karql/elastalert2-server:latest
```

Port `3030` is the REST API, `3333` the websocket for testing rules. If Elasticsearch runs on the Docker host, you can use `--network host` instead of the `-p` options and keep `localhost` (Linux only).

## Building Docker image

```bash
docker build -t karql/elastalert2-server .
```

Using a custom ElastAlert2 version (a [release from GitHub](https://github.com/jertel/elastalert2/releases)), e.g. `master`:

```bash
docker build --build-arg ELASTALERT_VERSION=master -t elastalert2-server .
```

Using a custom mirror:

```bash
docker build --build-arg ELASTALERT_URL=http://example.mirror.com/master.zip -t elastalert2-server .
```

## Configuration

The configuration is located in `config/config.json`. For local development you can create `config/config.dev.json`, which is used instead of `config/config.json` when it exists.

Available options (all are optional, the values below are the defaults unless stated otherwise):

```javascript
{
  "appName": "elastalert-server", // The name used in the logs (`name` field)
  "port": 3030, // The port of the REST API
  "wsport": 3333, // The port of the websocket for testing rules
  "elastalertPath": "/opt/elastalert", // The ElastAlert2 folder, the working directory of the ElastAlert2 processes
  "start": "2014-01-01T00:00:00", // Optional (no default), date to start querying from
  "end": "2016-01-01T00:00:00", // Optional (no default), date to stop querying at, must be after "start"
  "verbose": false, // Increase the logging verboseness, which allows you to see information about the state of queries
  "es_debug": false, // Enable logging for all queries made to Elasticsearch (logged by ElastAlert2 on DEBUG level)
  "debug": false, // Run ElastAlert2 in debug mode: more logging, all alerts are replaced by DebugAlerter (printed, not sent) and nothing is written back to Elasticsearch
  "prometheus_port": null, // Expose ElastAlert2 Prometheus metrics on this port (null or 0 = disabled)
  "rulesPath": { // The folder with the rules
    "relative": true, // Whether the path is relative to `elastalertPath`
    "path": "/rules"
  },
  "templatesPath": { // The folder with the rule templates
    "relative": true, // Whether the path is relative to `elastalertPath`
    "path": "/rule_templates"
  },
  "dataPath": { // A folder for the server's data and temporary files (e.g. rules being tested)
    "relative": true, // Whether the path is relative to `elastalertPath`
    "path": "/server_data"
  },
  "writeback_index": "elastalert_status", // Writeback index created on startup (`elastalert.create_index --index`), should match `writeback_index` in `elastalert.yaml`
  "logging": { // See "Logging" below
    "level": "info", // fatal, error, warn, info, debug, trace or silent. Overridden by the LOG_LEVEL environment variable
    "format": "json" // json (one JSON object per line) or pretty (human readable). Overridden by the LOG_FORMAT environment variable
  }
}
```

The server does not connect to Elasticsearch itself, only the ElastAlert2 processes it starts do. The `es_*` options (`es_host`, `es_port`, `es_username`, `es_password`, `es_ssl`, `ea_verify_certs`, `es_ca_certs`, `es_client_cert`, `es_client_key`) were used by the `/metadata`, `/mapping` and `/search` endpoints removed in 6.0.0. They are ignored with a warning and can be removed from `config.json`.

ElastAlert2 itself is configured in `elastalert.yaml` (mounted as `/opt/elastalert/config.yaml`), which needs at least the following options. See the [ElastAlert2 documentation](https://elastalert2.readthedocs.io/en/latest/running_elastalert.html) for all of them.

```yaml
# The Elasticsearch host and port (every rule can have its own)
es_host: localhost
es_port: 9200

# The index used for metadata storage, created on startup
writeback_index: elastalert_status

# The folder with the rule yaml files, any .yaml file is loaded as a rule
rules_folder: rules

# How often ElastAlert2 queries Elasticsearch
run_every:
  seconds: 5

# ElastAlert2 buffers results from the most recent period of time,
# in case some log sources are not in real time
buffer_time:
  minutes: 1
```

`elastalert-test.yaml` (mounted as `/opt/elastalert/config-test.yaml`) is used only for testing rules through the API, e.g. to write to a different `writeback_index`.

### Logging

Logs are written to stdout by [pino](https://getpino.io), by default as one JSON object per line:

```json
{"level":30,"time":"2026-11-13T21:20:57.109Z","pid":1,"hostname":"5d81a9f99456","name":"elastalert-server","component":"Http","method":"GET","path":"/rules","status":200,"durationMs":4,"requestId":"fae7df0b-29ea-4b00-bf7b-1b9fd9982989","msg":"GET /rules 200 4ms"}
```

- `level` - numeric level: 10 trace, 20 debug, 30 info, 40 warn, 50 error, 60 fatal
- `name` - `appName` from the config for logs of this server, `elastalert` for logs of the ElastAlert2 processes
- `component` - part of the server (`Config`, `Server`, `ProcessService`, `Http`, ...) or the python logger name for ElastAlert2 logs (`elastalert`, `elasticsearch`, `py.warnings`, ...)
- `err` - error with `type`, `message` and `stack`, when an error is logged

Every HTTP request is logged by the `Http` component with `method`, `path` (without the query string), `status`, `durationMs` and `requestId`. Responses with status 5xx are logged as `error`, Swagger UI assets as `debug`. The request id is taken from the `X-Request-Id` request header or generated, and returned in the `X-Request-Id` response header.

Output of the ElastAlert2 processes is parsed line by line. Records in the python logging format (`LEVEL:logger:message`) keep their level, following lines without the prefix (e.g. a stack trace) are added to the same record. Other output is logged as `info` (stdout) or `error` (stderr). ElastAlert2 `DEBUG` records (e.g. from `es_debug`) are only visible with `"level": "debug"`.

Level and format are set in the `logging` section of `config.json` or with environment variables, which take precedence:

```bash
docker run -e LOG_LEVEL=debug -e LOG_FORMAT=pretty ... karql/elastalert2-server
```

JSON logs can also be made readable afterwards with [pino-pretty](https://github.com/pinojs/pino-pretty): `docker logs elastalert2-server | npx pino-pretty`.

## API

Interactive documentation is available at `/swagger-ui/` and the OpenAPI 3 spec at `/swagger.json`.

- **GET `/`** - name, port and version of the server

- **GET `/status`** - status of the ElastAlert2 process: `IDLE`, `STARTING`, `READY`, `CLOSING` or `ERROR`

- **GET `/status/control/:action`** - `:action` is `start` or `stop`, starts or stops the ElastAlert2 process

- **GET `/rules`** - ids of the rules in the `rulesPath` folder: `{ "rules": ["my_rule"] }`. Use the optional `?path=team` query to list a subfolder.

- **GET `/rules/:id`** - the yaml of the rule. Rules in subfolders use an encoded slash, e.g. `/rules/team%2Fmy_rule`.

- **POST `/rules/:id`** - creates or replaces the rule:

    ```javascript
    {
      // Required - the full yaml rule config
      "yaml": "..."
    }
    ```

- **DELETE `/rules/:id`** - deletes the rule

- **GET `/templates`**, **GET / POST / DELETE `/templates/:id`** - the same for rule templates in the `templatesPath` folder

- **POST `/test`** - tests a rule with `elastalert.test_rule` and returns its output:

    ```javascript
    {
      // Required - the full yaml rule config
      "rule": "...",

      // Optional - the options to use for testing the rule
      "options": {
        // "all" gives the full console output, "schemaOnly" only validates the yaml config,
        // "countOnly" only finds the number of matching documents and lists available fields
        "testType": "all",

        // Over how many days the test runs, any number larger than 0
        "days": 1,

        // Optional - start querying from this timestamp (ISO 8601, without an offset it is UTC). Takes precedence over "days"
        "start": "2026-11-12T00:00:00Z",

        // Optional - query to this timestamp (ISO 8601, without an offset it is UTC). Default: now.
        // Without "start" the test covers "days" before "end"
        "end": "2026-11-13T00:00:00Z",

        // Whether to send real alerts
        "alert": false,

        // Optional - return results in structured JSON
        "format": "json",

        // Limit returned results to this amount, 0 means no limit
        "maxResults": 0
      }
    }
    ```

- **WEBSOCKET `ws://host:3333/test`** (port `wsport`) - tests a rule and reports progress while it runs. Send the same JSON as the body of **POST `/test`**. The server sends events `{ "event": "...", "data": ... }`: `progress` (stderr of the test), `result` (stdout) and `error` (Problem Details, see below). Closing the websocket stops the test.

### Errors

Errors are returned as [Problem Details (RFC 9457)](https://www.rfc-editor.org/rfc/rfc9457) with `Content-Type: application/problem+json`:

```json
{
  "type": "urn:elastalert2-server:problem:rule-not-found",
  "title": "Rule not found",
  "status": 404,
  "detail": "The requested rule with id: 'my_rule' couldn't be found.",
  "instance": "/rules/my_rule"
}
```

Request validation errors use status `422` and list the invalid values in `errors` (`pointer` for body members, `parameter` + `in` for path / query parameters):

```json
{
  "type": "urn:elastalert2-server:problem:validation-error",
  "title": "Request validation failed",
  "status": 422,
  "detail": "The request contains 1 invalid value.",
  "instance": "/test",
  "errors": [{ "detail": "Too small: expected number to be >=1", "pointer": "#/options/days" }]
}
```

Problem types (prefix `urn:elastalert2-server:problem:`):

| `type` | Status |
|---|---|
| `validation-error` | 422 |
| `rule-not-found`, `template-not-found` | 404 |
| `rules-folder-not-found`, `templates-folder-not-found` | 404 |
| `rule-not-readable`, `rule-not-writable`, `template-not-readable`, `template-not-writable` | 403 |
| `rules-root-folder-not-creatable`, `templates-root-folder-not-creatable` | 403 |
| `test-rule-failed` | 500 |

Generic HTTP errors (malformed JSON `400`, unknown route `404`, unsupported media type `415`, unexpected error `500`) use `type: "about:blank"`.

## Contributing

Please report issues and suggestions on the [issues page](https://github.com/karql/elastalert2-server/issues). See [CONTRIBUTING.md](CONTRIBUTING.md) for the development setup and how to add a new API.

## License

[MIT](LICENSE.md)
