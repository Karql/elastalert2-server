## 5.0.0-next.3

### Changes

* Update eleastalert2 to v2.3.0
* Refactor file-system-service.ts
* Remove unused files

## 5.0.0-next.2

### Changes

* Improve logging from Elastalert ([#42](https://github.com/Karql/elastalert2-server/issues/42))
    * Use dedicated logger for elastalert 
    * Convert multiline log into singleline
    * Remove whitespaces

## 5.0.0-next.1

### Changes

* Update eleastalert2 to v2.2.3

## 5.0.0-next.0

### Changes

* Migrate to TypeScripts
* Add swagger support and completly redesign setup routes etc. (https://github.com/lukeautry/tsoa)
* Migrate to [ElastAlert2](https://github.com/jertel/elastalert2)
* Update npm packages
* Optimize docker image size
* Cleanup project a bit

### Removals

* [WIP] GET `/config` - empty endpoint 
* [WIP] POST `/config` - empty endpoint
* [WIP] POST `/download` - for security reasons

## 4.0.0 (2021-03-09)

### Changes
* Update python to version 3 (from version 0.2.0 of elastalert python2 is not supported) 
* Update build image to alpine:3.13
* Update main image to node:14-alpine
* Update elastalert to latest version (as of 2021-03-15) rev: 1dc4f30f30d39a689f419ce19c7e2e4d67a50be3