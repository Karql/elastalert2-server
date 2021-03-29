import Logger from '../../common/logger';
import FileSystem from '../../common/file-system/file-system';
import config from '../../common/config';
import path from 'path';
import randomstring from 'randomstring';
import {spawn} from 'child_process';
import ElastalertServer from '../../elastalert_server';
import { TestRuleOptions } from './test-rule-options.model';
import WebSocket from 'ws';

let logger = new Logger('TestController');
let fileSystem = new FileSystem();

export default class TestController {
  private _server: ElastalertServer;
  private _elastalertPath: string;
  private _testFolder: string;

  constructor(server: ElastalertServer) {
    this._server = server;
    this._elastalertPath = config.get().elastalertPath;
    this._testFolder = this._getTestFolder();

    fileSystem.createDirectoryIfNotExists(this._testFolder).catch((error) => {
      logger.error(`Failed to create the test folder in ${this._testFolder} with error:`, error);
    });
  }

  testRule(rule: string, options: TestRuleOptions, socket?: WebSocket) {
    const self = this;
    let tempFileName = '~' + randomstring.generate() + '.temp';
    let tempFilePath = path.join(self._testFolder, tempFileName);

    return new Promise(function (resolve, reject) {
      fileSystem.writeFile(tempFilePath, rule)
        .then(function () {
          let processOptions: string[] = [];
          let stdoutLines: string[] = [];
          let stderrLines: string[] = [];

          processOptions.push('-m', 'elastalert.test_rule', '--config', 'config-test.yaml', tempFilePath, '--days', options.days.toString());

          if (options.format === 'json') {
            processOptions.push('--formatted-output');
          }

          if (options.maxResults > 0) {
            processOptions.push('--max-query-size');
            processOptions.push(options.maxResults.toString());
          }

          if (options.alert) {
            processOptions.push('--alert');
          }

          switch (options.testType) {
            case 'schemaOnly':
              processOptions.push('--schema-only');
              break;
            case 'countOnly':
              processOptions.push('--count-only');
              break;
          }


          try {
            let testProcess = spawn('python', processOptions, {
              cwd: self._elastalertPath
            });

            // When the websocket closes we kill the test process
            // so it doesn't keep running detached
            if (socket) {
              socket.on('close', () => {
                testProcess.kill();

                fileSystem.deleteFile(tempFilePath)
                  .catch(function (error) {
                    logger.error(`Failed to delete temporary test file ${tempFilePath} with error:`, error);
                  });
              });
            }
              
            testProcess.stdout.on('data', function (data) {
              if (socket) {
                socket.send(JSON.stringify({ 
                  event: 'result',
                  data: data.toString() 
                }));
              }
              stdoutLines.push(data.toString());
            });

            testProcess.stderr.on('data', function (data) {
              if (socket) {
                socket.send(JSON.stringify({ 
                  event: 'progress',
                  data: data.toString() 
                }));
              }
              stderrLines.push(data.toString());
            });

            testProcess.on('exit', function (statusCode) {
              if (statusCode === 0) {
                if (options.format === 'json') {
                  resolve(stdoutLines.join(''));
                }
                else {
                  resolve(stdoutLines.join('\n'));
                }
              } else {
                if (!socket) {
                  reject(stderrLines.join('\n'));
                  logger.error(stderrLines.join('\n'));  
                }
              }

              fileSystem.deleteFile(tempFilePath)
                .catch(function (error) {
                  logger.error(`Failed to delete temporary test file ${tempFilePath} with error:`, error);
                });
            });
          } catch (error) {
            logger.error(`Failed to start test on ${tempFilePath} with error:`, error);
            reject(error);
          }
        })
        .catch(function (error) {
          logger.error(`Failed to write file ${tempFileName} to ${self._testFolder} with error:`, error);
          reject(error);
        });
    }).catch((error) => {
      logger.error('Failed to test rule with error:', error);
    });
  }

  _getTestFolder() {
    return path.join(this._server.getDataFolder(), 'tests');
  }
}
