export type LogLevel =
  | 'silent'
  | 'fatal'
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'trace';

export interface LoggerOptions {
  level?: LogLevel;
  scope?: string;
  prettyPrint?: boolean;
  metadata?: LoggerMetadata;
  theme?: string;
}

export interface Logger {
  error(message: string, metadata?: LoggerMetadata): void;
  warn(message: string, metadata?: LoggerMetadata): void;
  info(message: string, metadata?: LoggerMetadata): void;
  debug(message: string, metadata?: LoggerMetadata): void;
  trace(message: string, metadata?: LoggerMetadata): void;
  fatal(message: string, metadata?: LoggerMetadata): void;
  child(metadata: LoggerMetadata): Logger;
  isLevelEnabled(level: LogLevel): boolean;
}

export type LoggerMetadata = Record<string, any>;

export interface ThemeDefinition {
  error: string;
  warn: string;
  info: string;
  debug: string;
  trace: string;
  fatal: string;
  timestamp: string;
  scope: string;
}

export interface TimingOptions {
  warnThreshold?: number;
  includeStack?: boolean;
  metadata?: LoggerMetadata;
}

export type AsyncFunction<T = any> = () => Promise<T>;

export interface TimingFunction {
  <T>(
    logger: Logger,
    operationName: string,
    fn: AsyncFunction<T>,
    metadata?: LoggerMetadata,
  ): Promise<T>;
}
