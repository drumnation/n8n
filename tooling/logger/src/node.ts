import {pino} from 'pino';
import type {Logger as PinoLogger} from 'pino';
import type {Logger, LoggerOptions, LoggerMetadata, LogLevel} from './types.js';
import {getThemeByName, isValidTheme} from './themes.js';
import {timing} from './timing.js';

const isProduction = process.env.NODE_ENV === 'production';

function createPrettyTransport(theme?: string): any {
  if (isProduction) return undefined;

  const prettyOptions: any = {
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
  };

  if (theme && isValidTheme(theme)) {
    const themeColors = getThemeByName(theme);
    if (themeColors) {
      prettyOptions.customColors = `error:red,warn:yellow,info:green,debug:blue,trace:magenta,fatal:redBright`;
    }
  }

  return pino.transport({
    target: 'pino-pretty',
    options: prettyOptions,
  });
}

class NodeLogger implements Logger {
  private pino: PinoLogger;

  constructor(pinoInstance: PinoLogger) {
    this.pino = pinoInstance;
  }

  error(message: string, metadata?: LoggerMetadata): void {
    this.pino.error(metadata, message);
  }

  warn(message: string, metadata?: LoggerMetadata): void {
    this.pino.warn(metadata, message);
  }

  info(message: string, metadata?: LoggerMetadata): void {
    this.pino.info(metadata, message);
  }

  debug(message: string, metadata?: LoggerMetadata): void {
    this.pino.debug(metadata, message);
  }

  trace(message: string, metadata?: LoggerMetadata): void {
    this.pino.trace(metadata, message);
  }

  fatal(message: string, metadata?: LoggerMetadata): void {
    this.pino.fatal(metadata, message);
  }

  child(metadata: LoggerMetadata): Logger {
    return new NodeLogger(this.pino.child(metadata));
  }

  isLevelEnabled(level: LogLevel): boolean {
    return this.pino.isLevelEnabled(level);
  }
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const level = options.level || (process.env.LOG_LEVEL as LogLevel) || 'info';
  const theme = options.theme || process.env.LOG_THEME;

  const pinoOptions: pino.LoggerOptions = {
    level,
    base: options.scope ? {scope: options.scope} : undefined,
  };

  const transport =
    options.prettyPrint !== false && !isProduction
      ? createPrettyTransport(theme)
      : undefined;

  const pinoInstance = transport
    ? pino(pinoOptions, transport)
    : pino(pinoOptions);

  if (options.metadata) {
    return new NodeLogger(pinoInstance.child(options.metadata));
  }

  return new NodeLogger(pinoInstance);
}

export {timing};
export * from './themes.js';
export * from './types.js';
