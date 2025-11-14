import type {Logger, LoggerMetadata, AsyncFunction} from './types.js';

const WARN_THRESHOLD_MS = 500;

// Support both Logger interface and console fallback
type LoggerLike = Logger | Console;

export async function timing<T>(
  logger: LoggerLike,
  operationName: string,
  fn: AsyncFunction<T>,
  metadata: LoggerMetadata = {},
): Promise<T> {
  const startTime =
    typeof performance !== 'undefined' ? performance.now() : Date.now();

  // Helper to check if logger supports structured logging
  const isStructuredLogger = (logger: LoggerLike): logger is Logger => {
    return (
      typeof (logger as Logger).debug === 'function' &&
      (logger as Logger).debug.length > 1
    ); // Structured loggers accept metadata
  };

  // Log start
  if (isStructuredLogger(logger)) {
    logger.debug(`Starting operation: ${operationName}`, {
      operation: operationName,
      ...metadata,
    });
  } else {
    logger.debug(`Starting operation: ${operationName}`);
  }

  try {
    const result = await fn();
    const endTime =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = Math.round(endTime - startTime);

    const logMetadata = {
      operation: operationName,
      duration: `${duration}ms`,
      ...metadata,
    };

    // Log completion
    if (isStructuredLogger(logger)) {
      if (duration > WARN_THRESHOLD_MS) {
        logger.warn(`Slow operation completed: ${operationName}`, logMetadata);
      } else {
        logger.info(`Operation completed: ${operationName}`, logMetadata);
      }
    } else {
      const message = `Operation completed: ${operationName} (${duration}ms)`;
      if (duration > WARN_THRESHOLD_MS) {
        logger.warn(message);
      } else {
        logger.log(message);
      }
    }

    return result;
  } catch (error) {
    const endTime =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = Math.round(endTime - startTime);

    // Log error
    if (isStructuredLogger(logger)) {
      logger.error(`Operation failed: ${operationName}`, {
        operation: operationName,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error),
        ...metadata,
      });
    } else {
      logger.error(
        `Operation failed: ${operationName} (${duration}ms) - ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    throw error;
  }
}
