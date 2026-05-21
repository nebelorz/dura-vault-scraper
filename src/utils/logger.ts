enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

/**
 * Formats a log message with timestamp and log level.
 */
function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
}

/**
 * Logs a section message to the console.
 */
export function section(message: string, ...args: any[]): void {
  console.log(`\n${formatMessage(LogLevel.INFO, '>> ' + message)}`, ...args);
}

/**
 * Logs an info message to the console.
 */
export function info(message: string, ...args: any[]): void {
  console.log(formatMessage(LogLevel.INFO, message), ...args);
}

/**
 * Logs a warning message to the console.
 */
export function warn(message: string, ...args: any[]): void {
  console.warn(formatMessage(LogLevel.WARN, message), ...args);
}

/**
 * Logs an error message to the console.
 */
export function error(message: string, ...args: any[]): void {
  console.error(formatMessage(LogLevel.ERROR, message), ...args);
}

/**
 * Logs a debug message to the console (can be disabled in production).
 */
export function debug(message: string, ...args: any[]): void {
  if (process.env.ENABLE_DEBUG === 'true') {
    console.debug(formatMessage(LogLevel.DEBUG, message), ...args);
  }
}

/**
 * Default logger export with all methods.
 */
export const logger = {
  section,
  info,
  warn,
  error,
  debug,
};
