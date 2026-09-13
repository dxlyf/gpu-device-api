/**
 * 临时调试页：探测本机 headless Chrome 能否拿到 WebGPU adapter，并尝试用 gfx 层在 WebGPU 上画东西。
 *
 * 这个文件与 gfx-debug.html 都是临时产物，定位完成后必须删除。
 */

import { OrthographicCamera } from '../src/gfx/Camera.js';
import { Renderer, materials, shapes } from '../src/gfx/index.js';
import type { GeometryDesc } from '../src/gfx/Geometry.js';

const lines: string[] = [];
function log(message: string): void {
  lines.push(message);
  document.getElementById('log')!.textContent = lines.join('\n');
  document.documentElement.dataset.gfxDebugLines = String(lines.length);
}

interface GpuLike {
  requestAdapter(options?: { forceFallbackAdapter?: boolean }): Promise<unknown>;
}

async function main(): Promise<void> {
  const gpu = (navigator as unknown as { gpu?: GpuLike }).gpu;
  log(`navigator.gpu: ${gpu ? '存在' : '不存在'}`);

  if (gpu) {
    const adapter = (await gpu.requestAdapter()) as {
      info?: { vendor?: string; architecture?: string; device?: string; description?: string };
      limits?: { maxBufferSize?: number };
    } | null;
    log(`requestAdapter() -> ${adapter ? '有 adapter' : 'null'}`);
    if (adapter) {
      log(`  adapter.info = ${JSON.stringify(adapter.info ?? null)}`);
      log(`  maxBufferSize = ${String(adapter.limits?.maxBufferSize ?? 'n/a')}`);
    } else {
      const fallback = (await gpu.requestAdapter({ forceFallbackAdapter: true })) as unknown;
      log(`requestAdapter({forceFallbackAdapter:true}) -> ${fallback ? '有 adapter' : 'null'}`);
    }
  }

  /* ---- 用 gfx 层实际画一次，看看两个后端各自的结果 ------------------------------------------- */

  const canvas = document.getElementById('view') as HTMLCanvasElement;
  const shapeCases: readonly [string, GeometryDesc][] = [
    ['box', shapes.createBox({ width: 1.2, height: 1.2, depth: 1.2 })],
    ['triangle(no index)', { position: new Float32Array([-0.8, -0.8, 0, 0.8, -0.8, 0, 0, 0.8, 0]) }],
  ];

  for (const [name, desc] of shapeCases) {
    for (const backend of ['webgl2', 'webgpu'] as const) {
      const localCanvas = document.createElement('canvas');
      localCanvas.width = 64;
      localCanvas.height = 64;
      try {
        const renderer = await Renderer.create({
          canvas: localCanvas,
          backend,
          antialias: false,
          depth: true,
          clearColor: [0.05, 0.05, 0.08, 1],
        });
        const camera = new OrthographicCamera({ size: 2.6, near: 0.1, far: 20, position: [0, 0, 4] });
        renderer.setCamera(camera);
        const geometry = renderer.createGeometry({ label: name, ...desc });
        const unlit = renderer.createMaterial(materials.unlit({ color: [1, 1, 1, 1] }));

        renderer.beginFrame({ color: [0.05, 0.05, 0.08, 1] });
        renderer.setMaterial(unlit);
        renderer.draw(geometry, {
          model: identity(),
          uniforms: { baseColor: [1, 1, 1, 1] },
        });
        renderer.endFrame();

        // 直接读画布像素：这一帧刚刚 endFrame，drawing buffer 还没被合成清掉。
        const pixels = await readCanvas(renderer, localCanvas);
        log(`[${backend}] ${name}: 实际后端=${renderer.backend} 中心像素=${pixels.center.join(',')}`);
        renderer.destroy();
      } catch (error: unknown) {
        log(`[${backend}] ${name}: 失败 — ${(error as Error).message.split('\n')[0]}`);
      }
    }
  }

  document.documentElement.dataset.gfxDebug = 'done';
}

async function readCanvas(
  renderer: Renderer,
  canvas: HTMLCanvasElement,
): Promise<{ center: number[] }> {
  if (renderer.backend === 'webgl2') {
    const gl = renderer.device.native as WebGL2RenderingContext;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const px = new Uint8Array(4);
    gl.readPixels(32, 32, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return { center: [px[0]!, px[1]!, px[2]!] };
  }
  void canvas;
  return { center: [-1, -1, -1] };
}

function identity(): Float32Array {
  const out = new Float32Array(16);
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}

main().catch((error: unknown) => {
  log(`FAIL: ${(error as Error).message}\n${(error as Error).stack ?? ''}`);
  document.documentElement.dataset.gfxDebug = 'fail';
});
