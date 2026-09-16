/** 极简的分级 logger，确保库不会无条件地向 console 输出。 */
export const LogLevel = {
    Silent: 0,
    Error: 1,
    Warn: 2,
    Info: 3,
    Debug: 4,
    Trace: 5,
};
export const LOG_LEVEL_NAMES = {
    0: 'silent',
    1: 'error',
    2: 'warn',
    3: 'info',
    4: 'debug',
    5: 'trace',
};
export const LOG_LEVEL_VALUES = {
    silent: LogLevel.Silent,
    error: LogLevel.Error,
    warn: LogLevel.Warn,
    info: LogLevel.Info,
    debug: LogLevel.Debug,
    trace: LogLevel.Trace,
};
let globalLevel = LogLevel.Warn;
export function setGlobalLogLevel(level) {
    globalLevel = typeof level === 'string' ? LOG_LEVEL_VALUES[level] : level;
}
export function getGlobalLogLevel() {
    return globalLevel;
}
export function createLogger(prefix = 'gpu-device-api', level) {
    const effective = () => level ?? globalLevel;
    const emit = (at, sink, message, rest) => {
        if (effective() < at)
            return;
        sink(`[${prefix}] ${message}`, ...rest);
    };
    return {
        get level() {
            return effective();
        },
        error: (message, ...rest) => emit(LogLevel.Error, console.error, message, rest),
        warn: (message, ...rest) => emit(LogLevel.Warn, console.warn, message, rest),
        info: (message, ...rest) => emit(LogLevel.Info, console.info, message, rest),
        debug: (message, ...rest) => emit(LogLevel.Debug, console.debug, message, rest),
        trace: (message, ...rest) => emit(LogLevel.Trace, console.debug, message, rest),
    };
}
/** 丢弃一切输出的 logger；便于测试和无头运行场景使用。 */
export const nullLogger = {
    level: LogLevel.Silent,
    error: () => { },
    warn: () => { },
    info: () => { },
    debug: () => { },
    trace: () => { },
};
//# sourceMappingURL=logger.js.map