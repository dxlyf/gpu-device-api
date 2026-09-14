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

interface DebugMarkerExtension {
  pushGroupMarkerEXT?(marker: string): void;
  popGroupMarkerEXT?(): void;
  insertEventMarkerEXT?(marker: string): void;
}

/** 每个 GL context 只查一次扩展（`getExtension` 本身也不便宜）。 */
const extensionCache = new WeakMap<WebGL2RenderingContext, DebugMarkerExtension | null>();

function markersFor(gl: WebGL2RenderingContext): DebugMarkerExtension | null {
  let extension = extensionCache.get(gl);
  if (extension === undefined) {
    extension = (gl.getExtension('EXT_debug_marker') as DebugMarkerExtension | null) ?? null;
    extensionCache.set(gl, extension);
  }
  return extension;
}

/** 该 context 是否真的支持调试分组（不支持时下面几个函数都是空操作）。 */
export function supportsDebugMarkers(gl: WebGL2RenderingContext): boolean {
  const extension = markersFor(gl);
  return extension !== null && typeof extension.pushGroupMarkerEXT === 'function';
}

export function pushDebugGroup(gl: WebGL2RenderingContext, label: string): void {
  markersFor(gl)?.pushGroupMarkerEXT?.(label);
}

export function popDebugGroup(gl: WebGL2RenderingContext): void {
  markersFor(gl)?.popGroupMarkerEXT?.();
}

export function insertDebugMarker(gl: WebGL2RenderingContext, label: string): void {
  markersFor(gl)?.insertEventMarkerEXT?.(label);
}
