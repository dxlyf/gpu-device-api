/** 极简的分级 logger，确保库不会无条件地向 console 输出。 */
export declare const LogLevel: {
    readonly Silent: 0;
    readonly Error: 1;
    readonly Warn: 2;
    readonly Info: 3;
    readonly Debug: 4;
    readonly Trace: 5;
};
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];
export declare const LOG_LEVEL_NAMES: Readonly<Record<LogLevel, string>>;
export type LogLevelName = 'silent' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
export declare const LOG_LEVEL_VALUES: Readonly<Record<LogLevelName, LogLevel>>;
export interface Logger {
    readonly level: LogLevel;
    error(message: string, ...rest: unknown[]): void;
    warn(message: string, ...rest: unknown[]): void;
    info(message: string, ...rest: unknown[]): void;
    debug(message: string, ...rest: unknown[]): void;
    trace(message: string, ...rest: unknown[]): void;
}
export declare function setGlobalLogLevel(level: LogLevel | LogLevelName): void;
export declare function getGlobalLogLevel(): LogLevel;
export declare function createLogger(prefix?: string, level?: LogLevel): Logger;
/** 丢弃一切输出的 logger；便于测试和无头运行场景使用。 */
export declare const nullLogger: Logger;
//# sourceMappingURL=logger.d.ts.map