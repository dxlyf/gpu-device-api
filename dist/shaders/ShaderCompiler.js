/**
 * 着色器编译调度：按后端选语言，并补上每种语言必需的样板。
 *
 * 这里**不做声明注入**：uniform block、bind group、顶点属性位置都由用户在源码里自己写，
 * core 只保证「同一份 ShaderSource 在两种后端下都能拿到可编译的最终源码」。
 *
 * GLSL 侧默认会自动补 `#version 300 es` 与默认精度限定符，并允许通过 `defines` 注入宏；
 * 这套自动包装可以通过 `ShaderModuleDescriptor.glsl` 关掉（见 {@link GlslWrapOptions}）。
 * WGSL 侧没有版本指令、也不需要精度声明，`defines` 会生成为顶层 `const`。
 */
import { ValidationError } from '../core/errors/ValidationError.js';
import { languageForBackend, missingSourceMessage, stageSource } from './ShaderSource.js';
/** GLSL ES 3.00 的版本指令；必须是源码的第一行。 */
export const GLSL_VERSION_DIRECTIVE = '#version 300 es\n';
/** 默认精度前言（不含版本指令）。 */
export const GLSL_PRECISION_PREAMBLE = 'precision highp float;\n' +
    'precision highp int;\n' +
    'precision highp sampler2D;\n' +
    'precision highp samplerCube;\n' +
    'precision highp sampler3D;\n' +
    'precision highp sampler2DArray;\n';
/** GLSL ES 3.00 必需的前言：版本号必须在第一行，其余为默认精度。 */
export const GLSL_PREAMBLE = GLSL_VERSION_DIRECTIVE + GLSL_PRECISION_PREAMBLE;
/**
 * 把 {@link GlslWrapOptions} 的缺省值补齐：
 * `version` 默认 `true`，`preamble` 默认 `true`（即 {@link GLSL_PRECISION_PREAMBLE}）。
 */
export function resolveGlslWrapOptions(options) {
    const rawPreamble = options?.preamble ?? true;
    const preamble = rawPreamble === true
        ? GLSL_PRECISION_PREAMBLE
        : rawPreamble === false || rawPreamble === ''
            ? false
            : rawPreamble;
    return { version: options?.version ?? true, preamble };
}
const GLSL_VERSION_LINE = /^\s*#version[^\n]*\n?/;
/** 首行的 `#version`（保留原样的捕获版，用于「不碰版本」的路径）。 */
const GLSL_LEADING_VERSION_LINE = /^(\s*#version[^\n]*\n?)([\s\S]*)$/;
/** 把 `defines` 渲染成 GLSL 的 `#define`。 */
export function glslDefines(defines) {
    if (!defines)
        return '';
    return Object.entries(defines)
        .map(([key, value]) => {
        if (typeof value === 'boolean')
            return `#define ${key} ${value ? 1 : 0}`;
        return `#define ${key} ${value}`;
    })
        .join('\n');
}
/** 把 `defines` 渲染成 WGSL 的顶层 `const`。 */
export function wgslDefines(defines) {
    if (!defines)
        return '';
    return Object.entries(defines)
        .map(([key, value]) => {
        if (typeof value === 'boolean')
            return `const ${key}: bool = ${value};`;
        if (typeof value === 'number') {
            return Number.isInteger(value) ? `const ${key}: i32 = ${value};` : `const ${key}: f32 = ${value};`;
        }
        return `const ${key}: f32 = ${value};`;
    })
        .join('\n');
}
/**
 * 把用户写的 GLSL 主体包成可编译的完整源码，默认顺序是：
 * `#version` → 精度前言 → `#define` → 用户源码。
 *
 * 两个可以独立关掉的自动动作（见 {@link GlslWrapOptions}）：
 *
 * - `version: true`（默认）：剥掉用户写的 `#version`，首行注入 `#version 300 es`；
 *   如果写的不是 300 es，会直接报错而不是静默替换 —— 否则很容易出现
 *   「本地能编译、上线编译不过」这种难查的问题。
 *   `version: false`：`#version` 原样保留，若有则仍排在第一位，前言/defines 插到它后面。
 * - `preamble: true`（默认）：拼接默认精度前言；传字符串则用自定义前言；`false` 则不拼。
 *
 * 两者都关掉且没有 `defines` 时**逐字节透传**，连首尾空白都不动。
 */
export function wrapGlslSource(body, defines, label = 'shader', options) {
    const { version, preamble } = resolveGlslWrapOptions(options);
    const defineBlock = glslDefines(defines);
    // 全部关掉：源码原样交给后端，本库一个字符都不改。
    if (!version && !preamble && !defineBlock)
        return body;
    let head = '';
    let rest = body;
    if (version) {
        const versionMatch = /^\s*#version\s+([^\n]*)/.exec(body);
        if (versionMatch) {
            const declared = versionMatch[1].trim();
            if (!/^300\s+es\b/.test(declared)) {
                throw new ValidationError(`[gpu-device-api] ShaderModule「${label}」声明了 \`#version ${declared}\`，` +
                    '但 WebGL2 后端只接受 GLSL ES 3.00（`#version 300 es`）。请删掉 `#version` 行，或改为 `#version 300 es`。\n' +
                    '（要自己掌控 `#version`，可以在 createShaderModule 里传 `glsl: { version: false }`。）');
            }
        }
        head = GLSL_VERSION_DIRECTIVE;
        rest = body.replace(GLSL_VERSION_LINE, '');
    }
    else {
        // 不碰版本：用户自己写的 `#version` 原样保留在最前面，前言与 defines 排在它之后
        // （GLSL 要求 `#version` 必须是第一条指令，所以不能把前言插到它前面）。
        const match = GLSL_LEADING_VERSION_LINE.exec(body);
        if (match) {
            head = match[1];
            rest = match[2];
        }
    }
    const parts = [head];
    if (preamble)
        parts.push(preamble);
    if (defineBlock)
        parts.push(`${defineBlock}\n`);
    parts.push(rest.trim());
    return `${parts.join('')}\n`;
}
/** 把用户写的 WGSL 主体与 `defines` 拼成完整源码。 */
export function wrapWgslSource(body, defines) {
    const defineBlock = wgslDefines(defines);
    return defineBlock ? `${defineBlock}\n\n${body.trim()}\n` : `${body.trim()}\n`;
}
/**
 * 生成某个 stage 的最终源码。缺少对应语言源码时抛出带完整上下文的
 * {@link ValidationError}（而不是让后端抛一句看不懂的编译错误）。
 */
export function compileShaderStage(request) {
    const { backend, source, stage, label = 'shader' } = request;
    const language = languageForBackend(backend);
    const raw = stageSource(source, language, stage);
    if (raw === undefined) {
        throw new ValidationError(missingSourceMessage(backend, stage, source, label));
    }
    if (language === 'glsl') {
        return {
            language,
            stage,
            code: wrapGlslSource(raw, request.defines, label, request.glsl),
            hasPreamble: resolveGlslWrapOptions(request.glsl).preamble !== false,
        };
    }
    return {
        language,
        stage,
        code: wrapWgslSource(raw, request.defines),
        hasPreamble: false,
    };
}
/**
 * 从 WebGL 的编译/链接日志里抽出出错行，并把对应源码行贴出来。
 * WebGL 的日志格式形如 `ERROR: 0:12: 'x' : undeclared identifier`。
 */
export function formatShaderErrorLog(log, code, label) {
    const lines = code.split('\n');
    const header = `[gpu-device-api] 着色器「${label}」编译失败：\n${log.trim()}\n`;
    const mentioned = new Set();
    const pattern = /ERROR:\s*\d+:(\d+)/g;
    let match;
    while ((match = pattern.exec(log)) !== null) {
        const lineNumber = Number(match[1]);
        if (lineNumber > 0)
            mentioned.add(lineNumber);
    }
    if (mentioned.size === 0) {
        return `${header}\n----- 完整源码 -----\n${withLineNumbers(lines)}\n`;
    }
    const context = [];
    for (const lineNumber of [...mentioned].sort((a, b) => a - b)) {
        context.push(`----- 第 ${lineNumber} 行附近 -----`);
        const from = Math.max(1, lineNumber - 3);
        const to = Math.min(lines.length, lineNumber + 3);
        context.push(withLineNumbers(lines.slice(from - 1, to), from));
    }
    return `${header}\n${context.join('\n')}\n`;
}
function withLineNumbers(lines, startAt = 1) {
    const width = String(startAt + lines.length - 1).length;
    return lines.map((line, index) => `${String(startAt + index).padStart(width, ' ')} | ${line}`).join('\n');
}
/** 便于调试：把源码按行号打印出来。 */
export function numberLines(code) {
    return withLineNumbers(code.split('\n'));
}
//# sourceMappingURL=ShaderCompiler.js.map