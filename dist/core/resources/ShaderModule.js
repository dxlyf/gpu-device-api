/**
 * 编译单元。
 *
 * WebGPU 只接受**一个**包含所有 entry point 的 WGSL 字符串，而 WebGL2 需要为每个 program
 * 分别编译 vertex 与 fragment 着色器再链接。因此 `ShaderModule` 保存的是**原始源码**，
 * 真正的编译推迟到创建管线时（`src/shaders` 负责选语言与补样板，各后端负责编译缓存）。
 *
 * 关于声明：core 采用 WebGPU 形状的模型，源码是自包含的 —— `@group/@binding`、
 * `layout(std140)`、`layout(location = N)` 都由使用者自己写（详见 `src/shaders`）。
 */
/** 归一化 `code` 的两种写法：字符串按 WGSL 处理。 */
export function resolveShaderSource(code) {
    if (typeof code === 'string')
        return { wgsl: code };
    return { ...code };
}
//# sourceMappingURL=ShaderModule.js.map