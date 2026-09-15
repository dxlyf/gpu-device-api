/**
 * 临时探针（不属于仓库产物，放在 .tmp-probe/ 下）：在真实 WebGL2 上下文里确认
 * `copyBufferSubData` 的可用性与绑定目标约束，以及库层 `copyBufferToBuffer` 的耗时与一致性。
 *
 * 结论写进 `<html data-probe-result="...">`，由 scripts/verify-headless.mjs 读取。
 */

import { BufferUsage, createDevice } from '../src/index.js';

const lines: string[] = [];
const results: Record<string, unknown> = {};

function record(key: string, value: unknown): void {
  results[key] = value;
  lines.push(`${key}=${typeof value === 'object' ? JSON.stringify(value) : String(value)}`);
}

function setData(key: string, value: string): void {
  document.documentElement.dataset[key] = value;
}

async function main(): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 8;
  const gl = canvas.getContext('webgl2');
  if (!gl) throw new Error('no webgl2 context');

  record('renderer', String(gl.getParameter(gl.RENDERER)));
  record('hasCopyBufferSubData', typeof (gl as unknown as { copyBufferSubData?: unknown }).copyBufferSubData);

  // ---- 探针 1：buffer 按 COPY_WRITE_BUFFER 分配后，能否改绑 COPY_READ_BUFFER ------------------
  const a = gl.createBuffer()!;
  gl.bindBuffer(gl.COPY_WRITE_BUFFER, a);
  gl.bufferData(gl.COPY_WRITE_BUFFER, 1024, gl.DYNAMIC_DRAW);
  record('errAfterAllocOnCopyWrite', gl.getError());
  gl.bindBuffer(gl.COPY_READ_BUFFER, a);
  record('errAfterRebindToCopyRead', gl.getError());

  const b = gl.createBuffer()!;
  gl.bindBuffer(gl.COPY_WRITE_BUFFER, b);
  gl.bufferData(gl.COPY_WRITE_BUFFER, 1024, gl.DYNAMIC_DRAW);
  gl.getError();

  // ---- 探针 2：copyBufferSubData 是否真的复制了字节 -----------------------------------------
  const pattern = new Uint8Array(256);
  for (let i = 0; i < pattern.length; i += 1) pattern[i] = i & 0xff;
  gl.bindBuffer(gl.COPY_WRITE_BUFFER, a);
  gl.bufferSubData(gl.COPY_WRITE_BUFFER, 0, pattern);
  record('errAfterUpload', gl.getError());
  // a 先被 COPY_READ_BUFFER 引用、再被 COPY_WRITE_BUFFER 引用 —— 允许吗？
  record('errBeforeCopy', gl.getError());
  gl.bindBuffer(gl.COPY_READ_BUFFER, a);
  gl.bindBuffer(gl.COPY_WRITE_BUFFER, b);
  gl.copyBufferSubData(gl.COPY_READ_BUFFER, gl.COPY_WRITE_BUFFER, 0, 128, 256);
  record('errAfterCopy', gl.getError());
  const back = new Uint8Array(256);
  gl.getBufferSubData(gl.COPY_WRITE_BUFFER, 128, back);
  record('errAfterReadback', gl.getError());
  let same = true;
  for (let i = 0; i < 256; i += 1) if (back[i] !== pattern[i]) same = false;
  record('copyBytesIdentical', same);

  // ---- 探针 3：ELEMENT_ARRAY_BUFFER 能否当 copy 源/目标 -------------------------------------
  const index = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 1024, gl.DYNAMIC_DRAW);
  gl.getError();
  gl.bindBuffer(gl.COPY_READ_BUFFER, index);
  record('errRebindIndexToCopyRead', gl.getError());
  gl.bindBuffer(gl.COPY_WRITE_BUFFER, index);
  record('errRebindIndexToCopyWrite', gl.getError());

  // ---- 探针 4：库层 copyBufferToBuffer 的一致性 + 耗时 ---------------------------------------
  const device = await createDevice({ canvas, backend: 'webgl2', label: 'probe', strictBackend: true });
  const sizes = [1 << 20, 16 << 20];
  for (const size of sizes) {
    const src = device.createBuffer({
      label: `src-${size}`,
      size,
      usage: BufferUsage.CopySrc | BufferUsage.CopyDst,
    });
    const dst = device.createBuffer({
      label: `dst-${size}`,
      size,
      usage: BufferUsage.CopySrc | BufferUsage.CopyDst,
    });

    const seed = new Uint8Array(size);
    for (let i = 0; i < size; i += 1) seed[i] = (i * 31 + (i >> 8)) & 0xff;
    device.queue.writeBuffer(src, 0, seed);

    const encoder = device.createCommandEncoder({ label: `probe-${size}` });
    encoder.copyBufferToBuffer(src, 0, dst, 0, size);
    device.queue.submit([encoder.finish()]);

    const mapped = await dst.mapAsync('read', 0, size);
    const readBack = new Uint8Array(mapped);
    let identical = true;
    for (let i = 0; i < size; i += 1) {
      if (readBack[i] !== seed[i]) {
        identical = false;
        break;
      }
    }
    record(`identical_${size}`, identical);
    dst.unmap();

    // 耗时：每次测「连续 8 次同区间拷贝的代码块」，取 9 次的中位数。
    const samples: number[] = [];
    for (let round = 0; round < 9; round += 1) {
      const started = performance.now();
      for (let repeat = 0; repeat < 8; repeat += 1) {
        const enc = device.createCommandEncoder({ label: `bench-${size}` });
        enc.copyBufferToBuffer(src, 0, dst, 0, size);
        device.queue.submit([enc.finish()]);
      }
      const elapsed = performance.now() - started;
      gl.finish();
      samples.push(elapsed / 8);
    }
    samples.sort((x, y) => x - y);
    record(`medianMs_${size}`, Number(samples[4]!.toFixed(4)));
    record(`minMs_${size}`, Number(samples[0]!.toFixed(4)));
    src.destroy();
    dst.destroy();
  }
  device.dispose();
}

try {
  await main();
  setData('probeResult', 'pass');
} catch (error) {
  record('error', `${(error as Error).name}: ${(error as Error).message}`);
  setData('probeResult', 'fail');
} finally {
  setData('probeLog', lines.join(' | '));
  const out = document.getElementById('out');
  if (out) out.textContent = lines.join('\n');
}
