import Logger from '../common/logger';
import FileSystemService from '../common/file-system/file-system.service';
import config from '../common/config';
import path from 'path';
import randomstring from 'randomstring';
import {ChildProcessWithoutNullStreams, spawn} from 'child_process';
import ElastalertServer from '../elastalert_server';
import WebSocket from 'ws';
import { TestRuleOptions, TestRuleOptionsDefaults } from '../models/test/test-rule-options.model';

let logger = new Logger('TestService');
let fileSystem = new FileSystemService();

export default class TestService {
  private _server: ElastalertServer;
  private _elastalertPath: string;
  private _testFolder: string;

  constructor(server: ElastalertServer) {
    this._server = server;
    this._elastalertPath = config.get().elastalertPath;
    this._testFolder = this.getTestFolder();

    fileSystem.createDirectoryIfNotExists(this._testFolder).catch((error) => {
      logger.error(`Failed to create the test folder in ${this._testFolder} with error:`, error);
    });
  }

  async testRule(rule: string, options?: TestRuleOptions, socket?: WebSocket) {
    let opt = {...TestRuleOptionsDefaults, ...options}

    const self = this;
    let tempFileName = '~' + randomstring.generate() + '.temp';
    let tempFilePath = path.join(self._testFolder, tempFileName);

    try {
      await fileSystem.writeFile(tempFilePath, rule);
    }
    catch (error) {
      logger.error(`Failed to write file ${tempFileName} to ${self._testFolder} with error:`, error);
      throw error;
    }

    let stdoutLines: string[] = [];
    let stderrLines: string[] = [];

    let processOptions = self.getProcessOptions(opt, tempFilePath);
    let testProcess: ChildProcessWithoutNullStreams;

    try {
      testProcess = spawn('python', processOptions, {
        cwd: self._elastalertPath
      });
    }
    catch (error) {
      logger.error(`Failed to start test on ${tempFilePath} with error:`, error);
      throw error;
    }

    // When the websocket closes we kill the test process
    // so it doesn't keep running detached
    if (socket) {
      socket.on('close', async () => {
        testProcess.kill();
        await self.deleteFile(tempFilePath);
      });
    }

    testProcess.stdout.on('data', (data) => self.onProcessStd(data.toString(), stdoutLines, socket, 'result'));
    testProcess.stderr.on('data', (data) => self.onProcessStd(data.toString(), stderrLines, socket, 'progress'));

    let exitPromise = new Promise(async (resolve, reject) => {
      testProcess.on('exit', async (statusCode) => {
        await self.deleteFile(tempFilePath);

        // For socket resolve immediately
        // data was already returned
        if (socket) {
          resolve(null);
        }

        if (statusCode === 0) {
          // TODO: propably this if is not needed
          if (opt.format === 'json') {
            resolve(stdoutLines.join(''));
          }
          else {
            resolve(stdoutLines.join('\n'));
          }
        }
        else {
          reject(stderrLines.join('\n'));
          logger.error(stderrLines.join('\n'));
        }
      });
    });

    await exitPromise;
  }

  private getTestFolder() {
    return path.join(this._server.getDataFolder(), 'tests');
  }

  private getProcessOptions(opt: TestRuleOptions, tempFilePath: string): string[] {
    let processOptions: string[] = [];

    processOptions.push('-m', 'elastalert.test_rule', '--config', 'config-test.yaml', tempFilePath, '--days', opt.days.toString());

    if (opt.format === 'json') {
      processOptions.push('--formatted-output');
    }

    if (opt.maxResults > 0) {
      processOptions.push('--max-query-size');
      processOptions.push(opt.maxResults.toString());
    }

    if (opt.alert) {
      processOptions.push('--alert');
    }

    switch (opt.testType) {
      case 'schemaOnly':
        processOptions.push('--schema-only');
        break;
      case 'countOnly':
        processOptions.push('--count-only');
        break;
    }

    return processOptions;
  }

  private onProcessStd(data: string, stdLines: string[], socket: WebSocket | undefined, event: string) {
    if (socket) {
      socket.send(JSON.stringify({
        event: event,
        data: data.toString()
      }));
    }
    else {
      stdLines.push(data.toString());
    }
  }

  private async deleteFile(tempFilePath: string) {
    try {
      await fileSystem.deleteFile(tempFilePath);
    }
    catch (error) {
      logger.error(`Failed to delete temporary test file ${tempFilePath} with error:`, error);
      // don't rethrow here
    }
  }
}
