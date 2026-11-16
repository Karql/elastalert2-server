/** Levels of the python logging module */
export type ElastalertLogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type ElastalertLogHandler = (level: ElastalertLogLevel, type: string, message: string) => void;

// Default python logging format: `LEVEL:logger_name:message`
const RecordStartRegexp = /^(?<level>DEBUG|INFO|WARNING|ERROR|CRITICAL):(?<type>[^:\s]+):(?<message>.*)$/;

interface PendingRecord {
  level: ElastalertLogLevel;
  type: string;
  lines: string[];
}

/**
 * Groups lines of ElastAlert2 output into log records.
 *
 * A record starts with a `LEVEL:logger_name:` prefix. Following lines without the prefix
 * (e.g. a stack trace) belong to the same record. Lines without any preceding record
 * start a new one with the default level and type (e.g. a traceback of an unhandled exception on stderr).
 *
 * A record is emitted when the next one starts, when no line arrives for `flushDelayMs`, or on `flush()`.
 */
export class ElastalertLogParser {
  private pending: PendingRecord | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly defaultLevel: ElastalertLogLevel,
    private readonly defaultType: string,
    private readonly onRecord: ElastalertLogHandler,
    private readonly flushDelayMs = 100,
  ) {}

  line(line: string) {
    const match = RecordStartRegexp.exec(line);

    if (match?.groups) {
      this.flush();
      this.pending = {
        level: match.groups['level'] as ElastalertLogLevel,
        type: match.groups['type'],
        lines: [match.groups['message']],
      };
    } else if (this.pending) {
      this.pending.lines.push(line);
    } else if (line.trim() !== '') {
      this.pending = { level: this.defaultLevel, type: this.defaultType, lines: [line] };
    } else {
      return;
    }

    this.scheduleFlush();
  }

  /** Splits the text into lines and parses them, e.g. whole output of a finished process */
  text(text: string) {
    text.split(/\r?\n/).forEach((line) => this.line(line));
  }

  flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (!this.pending) {
      return;
    }

    const { level, type, lines } = this.pending;
    this.pending = null;

    const message = lines.join('\n').trim();

    if (message !== '') {
      this.onRecord(level, type, message);
    }
  }

  private scheduleFlush() {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => this.flush(), this.flushDelayMs);
    this.timer.unref();
  }
}
