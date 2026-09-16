/**
 * 调试标记（debug marker）的 WebGL2 实现。
 *
 * WebGL2 本身没有 `pushDebugGroup`（那是 WebGPU 的 API），Chromium 系浏览器通过
 * `EXT_debug_marker` 扩展提供 `glPushGroupMarkerEXT` / `glPopGroupMarkerEXT` /
 * `glInsertEventMarkerEXT`，抓帧工具（RenderDoc、Chrome 的 WebGL 抓帧）据此把一帧分组显示。
 *
 * 约定：**扩展不可用时是空操作**。调试标记只影响抓帧工具的分组，不影响渲染结果，
 * 所以缺了它没有必要让调用方处理异常 —— 这一点与「不静默降级」的原则不冲突：
 * 那里说的是会改变渲染结果的能力。
 */
/** 该 context 是否真的支持调试分组（不支持时下面几个函数都是空操作）。 */
export declare function supportsDebugMarkers(gl: WebGL2RenderingContext): boolean;
export declare function pushDebugGroup(gl: WebGL2RenderingContext, label: string): void;
export declare function popDebugGroup(gl: WebGL2RenderingContext): void;
export declare function insertDebugMarker(gl: WebGL2RenderingContext, label: string): void;
//# sourceMappingURL=debugMarkers.d.ts.map