/** Minimal leveled logger so the library never writes to the console unconditionally. */

export const LogLevel = {
  Silent: 0,
  Error: 1,
  Warn: 2,
  Info: 3,
  Debug: 4,
  Trace: 5,
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export const LOG_LEVEL_NAMES: Readonly<Record<LogLevel, string>> = {
  0: 'silent',
  1: 'error',
  2: 'warn',
  3: 'info',
  4: 'debug',
  5: 'trace',
};

export type LogLevelName = 'silent' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export const LOG_LEVEL_VALUES: Readonly<Record<LogLevelName, LogLevel>> = {
  silent: LogLevel.Silent,
  error: LogLevel.Error,
  warn: LogLevel.Warn,
  info: LogLevel.Info,
  debug: LogLevel.Debug,
  trace: LogLevel.Trace,
};

export interface Logger {
  readonly level: LogLevel;
  error(message: string, ...rest: unknown[]): void;
  warn(message: string, ...rest: unknown[]): void;
  info(message: string, ...rest: unknown[]): void;
  debug(message: string, ...rest: unknown[]): void;
  trace(message: string, ...rest: unknown[]): void;
}

let globalLevel: LogLevel = LogLevel.Warn;

export function setGlobalLogLevel(level: LogLevel | LogLevelName): void {
  globalLevel = typeof level === 'string' ? LOG_LEVEL_VALUES[level] : level;
}

export function getGlobalLogLevel(): LogLevel {
  return globalLevel;
}

export function createLogger(prefix = 'gpu-device-api', level?: LogLevel): Logger {
  const effective = (): number => level ?? globalLevel;
  const emit = (at: LogLevel, sink: (...args: unknown[]) => void, message: string, rest: unknown[]): void => {
    if (effective() < at) return;
    sink(`[${prefix}] ${message}`, ...rest);
  };
  return {
    get level() {
      return effective() as LogLevel;
    },
    error: (message, ...rest) => emit(LogLevel.Error, console.error, message, rest),
    warn: (message, ...rest) => emit(LogLevel.Warn, console.warn, message, rest),
    info: (message, ...rest) => emit(LogLevel.Info, console.info, message, rest),
    debug: (message, ...rest) => emit(LogLevel.Debug, console.debug, message, rest),
    trace: (message, ...rest) => emit(LogLevel.Trace, console.debug, message, rest),
  };
}

/** Logger that discards everything; handy in tests and headless runs. */
export const nullLogger: Logger = {
  level: LogLevel.Silent,
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
  trace: () => {},
};
