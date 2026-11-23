import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import randomstring from 'randomstring';
import WebSocket from 'ws';
import type ElastalertServer from '../../server';
import { config } from '../../shared/config/config.service';
import FileSystemService from '../../shared/file-system/file-system.service';
import Logger from '../../shared/logger/logger';
import { TestRuleError } from './test.errors';
import { TestRuleOptions, TestRuleOptionsDefaults } from './test.schemas';

const logger = new Logger('TestService');
const fileSystem = new FileSystemService();

/** Runs `elastalert.test_rule` for a rule written to a temporary file in `<dataPath>/tests` */
export default class TestService {
  private readonly elastalertPath: string;
  private readonly testFolder: string;

  constructor(server: ElastalertServer) {
    this.elastalertPath = config.get().elastalertPath;
    this.testFolder = path.join(server.getDataFolder(), 'tests');

    fileSystem.createDirectoryIfNotExists(this.testFolder).catch((error) => {
      logger.error(`Failed to create the test folder in ${this.testFolder} with error:`, error);
    });
  }

  /**
   * Tests the rule and returns the output of `elastalert.test_rule`.
   * With a websocket the output is sent as `result` (stdout) / `progress` (stderr) events while the test runs,
   * the test is stopped when the websocket closes and an empty string is returned.
   */
  async testRule(rule: string, options?: Partial<TestRuleOptions>, socket?: WebSocket): Promise<string> {
    const opt = { ...TestRuleOptionsDefaults, ...options };
    const tempFilePath = path.join(this.testFolder, `~${randomstring.generate()}.temp`);

    try {
      await fileSystem.writeFile(tempFilePath, rule);
    } catch (error) {
      logger.error(`Failed to write the rule to ${tempFilePath} with error:`, error);
      throw error;
    }

    const stdout: string[] = [];
    const stderr: string[] = [];
    let statusCode: number | null;

    try {
      const testProcess = spawn('python', this.getProcessOptions(opt, tempFilePath), { cwd: this.elastalertPath });

      // When the websocket closes we kill the test process, so it doesn't keep running detached
      socket?.on('close', () => testProcess.kill());

      testProcess.stdout.on('data', (data) => this.onOutput(data.toString(), stdout, socket, 'result'));
      testProcess.stderr.on('data', (data) => this.onOutput(data.toString(), stderr, socket, 'progress'));

      statusCode = await waitForClose(testProcess);
    } catch (error) {
      logger.error(`Failed to run test on ${tempFilePath} with error:`, error);
      throw error;
    } finally {
      await this.deleteFile(tempFilePath);
    }

    // The output was already sent to the websocket
    if (socket) {
      return '';
    }

    if (statusCode === 0) {
      return stdout.join('');
    }

    const output = stderr.join('');
    logger.error(output);
    throw new TestRuleError(output);
  }

  private getProcessOptions(opt: TestRuleOptions, tempFilePath: string): string[] {
    const processOptions = ['-m', 'elastalert.test_rule', '--config', 'config-test.yaml', tempFilePath, '--days', opt.days.toString()];

    // test_rule uses --start instead of --days when both are set
    if (opt.start) {
      processOptions.push('--start', opt.start);
    }

    if (opt.end) {
      processOptions.push('--end', opt.end);
    }

    if (opt.format === 'json') {
      processOptions.push('--formatted-output');
    }

    if (opt.maxResults > 0) {
      processOptions.push('--max-query-size', opt.maxResults.toString());
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

  private onOutput(data: string, chunks: string[], socket: WebSocket | undefined, event: 'result' | 'progress') {
    if (!socket) {
      chunks.push(data);
    } else if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ event, data }));
    }
  }

  private async deleteFile(tempFilePath: string) {
    try {
      await fs.promises.rm(tempFilePath, { force: true });
    } catch (error) {
      // Only logged, the test result is more important
      logger.error(`Failed to delete temporary test file ${tempFilePath} with error:`, error);
    }
  }
}

/**
 * Resolves with the exit code on 'close' (not 'exit', which can fire before stdout / stderr ended),
 * rejects when the process can't be started (e.g. python not found).
 */
function waitForClose(childProcess: ChildProcessWithoutNullStreams): Promise<number | null> {
  return new Promise((resolve, reject) => {
    childProcess.once('error', reject);
    childProcess.once('close', resolve);
  });
}
