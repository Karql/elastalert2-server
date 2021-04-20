# Fork of [bitsensor/elastalert](https://github.com/bitsensor/elastalert)

Hi there!

Official repository is not maintained anymore. Last commit was a long time ago. From that moment some things have changed a bit. 

New version of [ElastAlert](https://github.com/Yelp/elastalert) was released and depends on python3. Some dependencies also went further.

I use and like this project so I have decided to develop it by my own.

Main goal of this fork is to support the latest version of [ElastAlert](https://github.com/Yelp/elastalert) - DONE!

Edit: 2021-09-09
[ElastAlert](https://github.com/Yelp/elastalert) is also not maintained anymore.

[ElastAlert2](https://github.com/jertel/elastalert2) has been born and now it is usied underhood.

In free time maybe something more ;)

Check [Docker Hub](https://hub.docker.com/r/karql/elastalert) for current images.

Chcek [ElastAlert Kibana plugin](https://github.com/karql/elastalert-kibana-plugin) repo to get plugin wokring with latest Kibana.


## Plans

:heavy_check_mark: Support the latest version of [ElastAlert](https://github.com/Yelp/elastalert) - DONE! Check this release: [4.0.0](https://github.com/Karql/elastalert/releases/tag/4.0.0) for more details.

:heavy_check_mark: Support the latest version of [ElastAlert2](https://github.com/jertel/elastalert2) - DONE! Not released yet.

![90%](https://progress-bar.dev/90) Migrate to TypeScript (left some cleanup & refactor)

![90%](https://progress-bar.dev/90) Add swagger (left some cleanup & refactor)

![0%](https://progress-bar.dev/0) Prepare a good getting started guide

---

# ElastAlert2 Server

A server that runs [ElastAlert2](https://github.com/jertel/elastalert2) and exposes REST API's for manipulating rules and alerts.

It works great in combination with fork [ElastAlert Kibana plugin](https://github.com/karql/elastalert-kibana-plugin).

You can also maintain everything directly  from swagger 😍 just add `/swagger-ui/` to the URL.

![GitHub release](https://img.shields.io/github/release/karql/elastalert.svg)
![Docker pulls](https://img.shields.io/docker/pulls/karql/elastalert.svg)
![GitHub stars](https://img.shields.io/github/stars/karql/elastalert.svg?style=social&label=Stars)

---

## Installation
The most convenient way to run the ElastAlert server is by using our Docker container image. The default configuration uses `localhost:9200` as ElasticSearch host, if this is not the case in your setup please edit `es_host` and `es_port` in both the `elastalert.yaml` and `config.json` configuration files.

To run the Docker image you will want to mount the volumes for configuration and rule files to keep them after container updates. In order to do that conveniently, please do: `git clone https://github.com/karql/elastalert.git; cd elastalert`

```bash
docker run -d -p 3030:3030 -p 3333:3333 \
    -v `pwd`/config/elastalert.yaml:/opt/elastalert/config.yaml \
    -v `pwd`/config/elastalert-test.yaml:/opt/elastalert/config-test.yaml \
    -v `pwd`/config/config.json:/opt/elastalert-server/config/config.json \
    -v `pwd`/rules:/opt/elastalert/rules \
    -v `pwd`/rule_templates:/opt/elastalert/rule_templates \
    --net="host" \
    --name elastalert karql/elastalert:latest
```

## Building Docker image

Clone the repository
```bash
git clone https://github.com/karql/elastalert.git && cd elastalert
```

Build the image
```
docker build -t elastalert .
```

### Options

Using a custom ElastAlert2 version (a [release from github](https://github.com/jertel/elastalert2/releases)) e.g. `master` or etc
```bash
docker build --build-arg ELASTALERT_VERSION=master -t elastalert .
```
Using a custom mirror
```bash
docker build --build-arg ELASTALERT_URL=http://example.mirror.com/master.zip -t elastalert .
```

## Configuration
In `config/config.example.json` you'll find the default config. You can make a `config.json` file in the same folder that overrides the default config. When forking this repository it is recommended to remove `config.json` from the `.gitignore` file. For local testing purposes you can then use a `config.dev.json` file which overrides `config.json`.

You can use the following config options:

```javascript
{
  "appName": "elastalert-server", // The name used by the logging framework.
  "port": 3030, // The port to bind to
  "wsport": 3333, // The port to bind to for websockets
  "elastalertPath": "/opt/elastalert",  // The path to the root ElastAlert2 folder. It's the folder that contains the `setup.py` script.
  "start": "2014-01-01T00:00:00", // Optional date to start querying from
  "end": "2016-01-01T00:00:00", // Optional date to stop querying at
  "verbose": true, // Optional, will increase the logging verboseness, which allows you to see information about the state of queries.
  "es_debug": true, // Optional, will enable logging for all queries made to Elasticsearch
  "debug": false, // Will run ElastAlert2 in debug mode. This will increase the logging verboseness, change all alerts to DebugAlerter, which prints alerts and suppresses their normal action, and skips writing search and alert metadata back to Elasticsearch.
  "rulesPath": { // The path to the rules folder containing all the rules. If the folder is empty a dummy file will be created to allow ElastAlert2 to start.
    "relative": true, // Whether to use a path relative to the `elastalert2 Path` folder.
    "path": "/rules" // The path to the rules folder. 
  },
  "templatesPath": { // The path to the rules folder containing all the rule templates. If the folder is empty a dummy file will be created to allow ElastAlert2 to start.
    "relative": true, // Whether to use a path relative to the `elastalert2 Path` folder.
    "path": "/rule_templates" // The path to the rule templates folder.
  },
  "dataPath": { // The path to a folder that the server can use to store data and temporary files.
    "relative": true, // Whether to use a path relative to the `elastalert Path` folder.
    "path": "/server_data" // The path to the data folder.
  },
  "es_host": "localhost", // For getting metadata and field mappings, connect to this ES server
  "es_port": 9200, // Port for above
  "writeback_index": "elastalert_status" // Writeback index to examine for /metadata endpoint
}
```

ElastAlert2 also expects a `elastalert.yaml` with at least the following options.
```yaml
# The elasticsearch hostname for metadata writeback
# Note that every rule can have its own elasticsearch host
es_host: localhost

# The elasticsearch port
es_port: 9200

# The index on es_host which is used for metadata storage
# This can be a unmapped index, but it is recommended that you run
# elastalert-create-index to set a mapping
writeback_index: elastalert_status

# This is the folder that contains the rule yaml files
# Any .yaml file will be loaded as a rule
rules_folder: rules

# How often ElastAlert2 will query elasticsearch
# The unit can be anything from weeks to seconds
run_every:
  seconds: 5

# ElastAlert2 will buffer results from the most recent
# period of time, in case some log sources are not in real time
buffer_time:
  minutes: 1
```

There is also a `elastalert-test.yaml` file which is only used when you use the API to test a rule. This allows you to write to a different `writeback_index` for example when testing rules.
 
## API
This server exposes the following REST API's:

- **GET `/`**

    Exposes the current version running
  
- **GET `/status`**

    Returns either 'SETUP', 'READY', 'ERROR', 'STARTING', 'CLOSING', 'FIRST_RUN' or 'IDLE' depending on the current ElastAlert2 process status. 
  
- **GET `/status/control/:action`**

    Where `:action` can be either 'start' or 'stop', which will respectively start or stop the current ElastAlert2 process.
  
- **GET `/rules`**

    Returns a list of directories and rules that exist in the `rulesPath` (from the config) and are being run by the ElastAlert2 process.
  
- **GET `/rules/:id`**

    Where `:id` is the id of the rule returned by **GET `/rules`**, which will return the file contents of that rule.
  
- **POST `/rules/:id`**

    Where `:id` is the id of the rule returned by **GET `/rules`**, which will allow you to edit the rule. The body send should be:
  
      ```javascript
      {
        // Required - The full yaml rule config.
        "yaml": "..."
      }
      ```
    
- **DELETE `/rules/:id`**

    Where `:id` is the id of the rule returned by **GET `/rules`**, which will delete the given rule.

- **GET `/templates`**

    Returns a list of directories and templates that exist in the `templatesPath` (from the config) and are being run by the ElastAlert2 process.
  
- **GET `/templates/:id`**

    Where `:id` is the id of the template returned by **GET `/templates`**, which will return the file contents of that template.
  
- **POST `/templates/:id`**

    Where `:id` is the id of the template returned by **GET `/templates`**, which will allow you to edit the template. The body send should be:
  
      ```javascript
      {
        // Required - The full yaml template config.
        "yaml": "..."
      }
      ```
    
- **DELETE `/templates/:id`**

    Where `:id` is the id of the template returned by **GET `/templates`**, which will delete the given template.
  
- **POST `/test`**

    This allows you to test a rule. The body send should be:
  
      ```javascript
      {
        // Required - The full yaml rule config.
        "rule": "...",
        
        // Optional - The options to use for testing the rule.
        "options": {
        
          // Can be either "all", "schemaOnly" or "countOnly". "all" will give the full console output. 
          // "schemaOnly" will only validate the yaml config. "countOnly" will only find the number of matching documents and list available fields.
          "testType": "all",
          
          // Can be any number larger than 0 and this tells ElastAlert2 over a period of how many days the test should be run
          "days": "1"
          
          // Whether to send real alerts
          "alert": false,

          // Return results in structured JSON
          "format": "json",

          // Limit returned results to this amount
          "maxResults": 1000
        }
      }
      ``` 

- **WEBSOCKET `/test`**
    
    This allows you to test a rule and receive progress over a websocket. Send a message as JSON object (stringified) with two keys: `rule` (yaml string) and `options` (JSON object). You will receive progress messages over the socket as the test runs.

- **GET `/metadata/:type`**

    Returns metadata from elasticsearch related to elasalert's state. `:type` should be one of: elastalert_status, elastalert, elastalert_error, or silence. See [docs about the elastalert2 metadata index](https://elastalert2.readthedocs.io/en/latest/elastalert_status.html).

- **GET `/mapping/:index`**

    Returns field mapping from elasticsearch for a given index. 

- **POST `/search/:index`**

    Performs elasticsearch query on behalf of the API. JSON body to this endpoint will become body of an ES search. 
        
## Contributing
Want to contribute to this project? Great! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting an issue or a pull request.

**We only accept pull requests on our [GitHub repository](https://github.com/bitsensor/elastalert)!**
 
## Contact
We'd love to help you if you have any questions. You can contact us by sending an e-mail to [dev@bitsensor.io](mailto:dev@bitsensor.io) or by using the [contact info on our website]().
 
## License
This project is [BSD Licensed](../LICENSE.md) with some modifications. Note that this only accounts for the ElastAlert Server, not ElastAlert itself ([ElastAlert License](https://github.com/Yelp/elastalert#license)).

## Disclaimer
We [(BitSensor)](https://www.bitsensor.io) do not have any rights over the original [ElastAlert](https://github.com/Yelp/elastalert) project from [Yelp](https://www.yelp.com/). We do not own any trademarks or copyright to the name "ElastAlert" (ElastAlert, however, does because of their Apache 2 license). We do own copyright over the source code of this project, as stated in our BSD license, which means the copyright notice below and as stated in the BSD license should be included in (merged / changed) distributions of this project. The BSD license also states that making promotional content using 'BitSensor' is prohibited. However we hereby grant permission to anyone who wants to use the phrases 'BitSensor ElastAlert Plugin', 'BitSensor Software' or 'BitSensor Alerting' in promotional content. Phrases like 'We use BitSensor' or 'We use BitSensor security' when only using our ElastAlert Server are forbidden.

## Copyright
Copyright © 2018, BitSensor B.V.
All rights reserved.
