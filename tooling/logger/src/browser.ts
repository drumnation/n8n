import type {Logger, LoggerOptions, LoggerMetadata, LogLevel} from './types.js';
import {getThemeByName, isValidTheme} from './themes.js';
import {timing} from './timing.js';

const LOG_LEVELS: Record<LogLevel, number> = {
  silent: 0,
  fatal: 10,
  error: 20,
  warn: 30,
  info: 40,
  debug: 50,
  trace: 60,
};

class BrowserLogger implements Logger {
  private level: number;
  private scope?: string;
  private theme?: string;
  private baseMetadata: LoggerMetadata;

  constructor(
    level: LogLevel = 'info',
    scope?: string,
    theme?: string,
    baseMetadata: LoggerMetadata = {},
  ) {
    this.level = LOG_LEVELS[level];
    this.scope = scope;
    this.theme = theme;
    this.baseMetadata = baseMetadata;
  }

  private getThemeColor(level: string): string {
    if (!this.theme || !isValidTheme(this.theme)) {
      return this.getDefaultColor(level);
    }

    const themeColors = getThemeByName(this.theme);
    return themeColors
      ? themeColors[level as keyof typeof themeColors]
      : this.getDefaultColor(level);
  }

  private getDefaultColor(level: string): string {
    const colors: Record<string, string> = {
      error: '#ff5555',
      warn: '#ffb86c',
      info: '#8be9fd',
      debug: '#50fa7b',
      trace: '#bd93f9',
      fatal: '#ff79c6',
    };
    return colors[level] || '#ffffff';
  }

  private log(
    level: LogLevel,
    message: string,
    metadata?: LoggerMetadata,
  ): void {
    if (this.level < LOG_LEVELS[level]) return;

    const timestamp = new Date().toISOString();
    const scopePrefix = this.scope ? `[${this.scope}]` : '';
    const color = this.getThemeColor(level);

    const fullMetadata = {...this.baseMetadata, ...metadata};
    const hasMetadata = Object.keys(fullMetadata).length > 0;

    const consoleMethod =
      level === 'error' || level === 'fatal'
        ? 'error'
        : level === 'warn'
          ? 'warn'
          : level === 'debug' || level === 'trace'
            ? 'debug'
            : 'log';

    if (hasMetadata) {
      console[consoleMethod](
        `%c${timestamp} %c${level.toUpperCase()}%c ${scopePrefix}${message}`,
        `color: ${this.getThemeColor('timestamp')}`,
        `color: ${color}; font-weight: bold`,
        `color: ${this.getThemeColor('scope')}`,
        fullMetadata,
      );
    } else {
      console[consoleMethod](
        `%c${timestamp} %c${level.toUpperCase()}%c ${scopePrefix}${message}`,
        `color: ${this.getThemeColor('timestamp')}`,
        `color: ${color}; font-weight: bold`,
        `color: ${this.getThemeColor('scope')}`,
      );
    }
  }

  error(message: string, metadata?: LoggerMetadata): void {
    this.log('error', message, metadata);
  }

  warn(message: string, metadata?: LoggerMetadata): void {
    this.log('warn', message, metadata);
  }

  info(message: string, metadata?: LoggerMetadata): void {
    this.log('info', message, metadata);
  }

  debug(message: string, metadata?: LoggerMetadata): void {
    this.log('debug', message, metadata);
  }

  trace(message: string, metadata?: LoggerMetadata): void {
    this.log('trace', message, metadata);
  }

  fatal(message: string, metadata?: LoggerMetadata): void {
    this.log('fatal', message, metadata);
  }

  child(metadata: LoggerMetadata): Logger {
    return new BrowserLogger(
      Object.keys(LOG_LEVELS).find(
        (key) => LOG_LEVELS[key as LogLevel] === this.level,
      ) as LogLevel,
      this.scope,
      this.theme,
      {...this.baseMetadata, ...metadata},
    );
  }

  isLevelEnabled(level: LogLevel): boolean {
    return this.level >= LOG_LEVELS[level];
  }
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const level =
    options.level ||
    (typeof window !== 'undefined' &&
      ((window as any).import?.meta?.env?.VITE_LOG_LEVEL as LogLevel)) ||
    'info';

  const theme =
    options.theme ||
    (typeof window !== 'undefined' &&
      (window as any).import?.meta?.env?.VITE_LOG_THEME);

  return new BrowserLogger(level, options.scope, theme, options.metadata);
}

export {timing};
export * from './themes.js';
export * from './types.js';
