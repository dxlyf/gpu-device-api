/**
 * 着色器编译诊断与「异步管线预热」的结果结构。
 *
 * 两个后端的编译时机与诊断来源完全不同：
 *
 * - **WebGPU**：`createRenderPipeline` / `createComputePipeline` 是同步返回的，具体编译在驱动里
 *   异步进行；`GPUShaderModule.getCompilationInfo()` 给出结构化的
 *   `type` / `lineNum` / `linePos` / `message`。真异步入口是 `createRenderPipelineAsync`。
 * - **WebGL2**：program 必须「编译两个 shader + 链接」才算存在，同步接口里
 *   `getProgramParameter(LINK_STATUS)` 会**阻塞到链接完成**；要真正异步就得靠
 *   `KHR_parallel_shader_compile` 的 `COMPLETION_STATUS_KHR` 轮询。诊断只有
 *   `getShaderInfoLog()` / `getProgramInfoLog()` 返回的**原始文本**（形如
 *   `ERROR: 0:12: 'x' : undeclared identifier`），行号要从文本里解析，而且没有列号。
 *
 * 这里把两者归一成同一份 {@link CompilationInfo}，让上层（预热入口、编辑器、命令行诊断）
 * 不必分后端写两套输出。拿不到的字段一律用 `null` 表示 —— **不编造**：编造出的行号比没有行号
 * 更浪费时间。
 */
import { SHADER_STAGE_NAMES } from '../enums/ShaderStage.js';
/** 构造一份 {@link CompilationInfo}；`hasErrors` 由 messages 推导，不单独传入。 */
export function createCompilationInfo(input) {
    const messages = input.messages ?? [];
    return {
        label: input.label,
        backend: input.backend,
        messages,
        rawLogs: input.rawLogs ?? [],
        hasErrors: messages.some((message) => message.type === 'error'),
    };
}
/** 把多份诊断合并成一份（render pipeline 的 vertex + fragment 就要合起来看）。 */
export function mergeCompilationInfo(label, backend, infos) {
    const messages = [];
    const rawLogs = [];
    for (const info of infos) {
        messages.push(...info.messages);
        rawLogs.push(...info.rawLogs);
    }
    return createCompilationInfo({ label, backend, messages, rawLogs });
}
/**
 * 一份「没有诊断」的结果。
 *
 * 注意它与「不支持诊断」的区别：不支持的后端会额外给一条 `info` 级 message 说明原因，
 * 而不是假装「编译干净」。
 */
export function emptyCompilationInfo(label, backend) {
    return createCompilationInfo({ label, backend });
}
/** 构造一条诊断，顺手补上 label / backend 这些公共字段。 */
export function createCompilationMessage(input) {
    return {
        type: input.type,
        message: input.message,
        // WebGPU 用 0 表示「不知道行号」，这里归一成 null，避免和「第 0 行」混淆。
        lineNum: input.lineNum === undefined || input.lineNum === null || input.lineNum <= 0 ? null : input.lineNum,
        linePos: input.linePos === undefined || input.linePos === null || input.linePos <= 0 ? null : input.linePos,
        stage: input.stage ?? null,
        label: input.label,
        backend: input.backend,
    };
}
/** 阶段的可读名（`null` 时给 `program`，因为 GL 的链接日志属于整个 program）。 */
export function compilationStageName(stage) {
    if (stage === null)
        return 'program';
    return SHADER_STAGE_NAMES[stage] ?? `stage${stage}`;
}
/**
 * 把一条诊断拼成一行可读文本，带上 label / 后端 / 阶段 / 行号。
 *
 * 形如：`[gpu-device-api] shader "pbr:shader" (webgl2, fragment) 12:7: error: 'x' : undeclared identifier`
 * 行号或列号拿不到时那一段直接省略，不留空的占位符。
 */
export function formatCompilationMessage(message) {
    const where = `"${message.label}" (${message.backend}, ${compilationStageName(message.stage)})`;
    let position = '';
    if (message.lineNum !== null) {
        position = ` ${message.lineNum}`;
        if (message.linePos !== null)
            position += `:${message.linePos}`;
        position += ':';
    }
    return `[gpu-device-api] shader ${where}${position} ${message.type}: ${message.message}`;
}
/** 把一整份 {@link CompilationInfo} 输出成多行文本（每条 message 一行）。 */
export function describeCompilationInfo(info) {
    const errors = info.messages.filter((message) => message.type === 'error').length;
    const header = `[gpu-device-api] compilation info for "${info.label}" (${info.backend}): ` +
        `${info.messages.length} message(s), ${errors} error(s)`;
    if (info.messages.length === 0)
        return header;
    return [header, ...info.messages.map((message) => `  ${formatCompilationMessage(message)}`)].join('\n');
}
/** 运行时判断：这个值是不是一份 {@link CompilationInfo}（用于跨包边界的收窄）。 */
export function isCompilationInfo(value) {
    if (!value || typeof value !== 'object')
        return false;
    const candidate = value;
    return Array.isArray(candidate.messages) && typeof candidate.hasErrors === 'boolean';
}
/* ------------------------------------------------------------------------------------------------ */
/* GL 日志解析                                                                                        */
/* ------------------------------------------------------------------------------------------------ */
/**
 * ANGLE / SwiftShader 风格：`ERROR: 0:12: 'x' : undeclared identifier`。
 * 中间那个数字是「source string index」（本库固定为 0）。
 */
const GL_ANGLE_LOG = /^\s*(ERROR|WARNING|INFO)\s*:\s*\d+\s*:\s*(\d+)\s*:\s*(.*)$/;
/** 部分桌面驱动风格：`0(12) : error C0000: syntax error`。 */
const GL_DESKTOP_LOG = /^\s*\d+\s*\(\s*(\d+)\s*\)\s*:\s*(error|warning|info)\b\s*:?\s*(.*)$/i;
/** 兜底：任意日志里冒出来的 `:行号:` 片段。 */
const GL_ANY_LINE = /:\s*(\d+)\s*:/;
function normalizeType(raw) {
    const lower = raw.toLowerCase();
    if (lower === 'error')
        return 'error';
    if (lower === 'warning')
        return 'warning';
    return 'info';
}
/**
 * 把 GL 的编译/链接日志原文解析成结构化诊断。
 *
 * 解析不出来的行不会被丢掉，而是变成一条 `lineNum: null` 的诊断：GL 的日志格式没有统一标准
 * （ANGLE、Mesa、各家驱动都不一样），「宁可给一条没有行号的 message，也不要静默吞掉」。
 *
 * @param log `gl.getShaderInfoLog()` / `gl.getProgramInfoLog()` 的原文
 * @param label 该 stage 或 program 的 label
 * @param backend 固定为 `'webgl2'`
 * @param stage 这条日志属于哪个阶段；链接日志传 `null`
 */
export function parseGlCompilationLog(log, label, backend, stage) {
    const messages = [];
    for (const rawLine of log.split('\n')) {
        const line = rawLine.trim();
        if (line === '')
            continue;
        const angle = GL_ANGLE_LOG.exec(line);
        if (angle) {
            messages.push(createCompilationMessage({
                type: normalizeType(angle[1]),
                message: angle[3].trim(),
                lineNum: Number(angle[2]),
                linePos: null,
                label,
                backend,
                stage,
            }));
            continue;
        }
        const desktop = GL_DESKTOP_LOG.exec(line);
        if (desktop) {
            messages.push(createCompilationMessage({
                type: normalizeType(desktop[2]),
                message: desktop[3].trim(),
                lineNum: Number(desktop[1]),
                linePos: null,
                label,
                backend,
                stage,
            }));
            continue;
        }
        const anyLine = GL_ANY_LINE.exec(line);
        messages.push(createCompilationMessage({
            // 没有前缀时按 error 处理：GL 的信息日志里真正值得注意的就是错误，
            // 而这条路径本来就是「编译/链接失败」才会走到。
            type: 'error',
            message: line,
            lineNum: anyLine ? Number(anyLine[1]) : null,
            linePos: null,
            label,
            backend,
            stage,
        }));
    }
    return messages;
}
/** `PrewarmOptions.timeoutMs` 的默认值：30 秒。真机上一次管线编译通常远小于它。 */
export const DEFAULT_PREWARM_TIMEOUT_MS = 30_000;
/** 取当前时间（浏览器与 node 都能用）。 */
export function nowMs() {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
/**
 * 把一个 promise 包上超时。
 *
 * 超时抛出的错误带 `[gpu-device-api] ` 前缀，且**不会**取消底层操作
 * （WebGPU 的 `createRenderPipelineAsync` 没有取消接口）——调用方要接受「结果可能会晚到」。
 */
export async function withTimeout(promise, timeoutMs, what) {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
        return promise;
    let timer;
    try {
        return await Promise.race([
            promise,
            new Promise((_resolve, reject) => {
                timer = setTimeout(() => {
                    reject(new Error(`[gpu-device-api] ${what} did not finish within ${timeoutMs}ms.`));
                }, timeoutMs);
            }),
        ]);
    }
    finally {
        if (timer !== undefined)
            clearTimeout(timer);
    }
}
/**
 * 让出一轮事件循环。
 *
 * WebGL2 的 `COMPLETION_STATUS_KHR` 轮询靠它把控制权还给渲染循环：同步自旋会把
 * 「异步等待」变成「阻塞等待」，那就白做了。
 */
export function yieldToEventLoop() {
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}
//# sourceMappingURL=CompilationInfo.js.map