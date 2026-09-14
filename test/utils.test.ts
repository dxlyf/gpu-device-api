import { describe, expect, it, vi } from 'vitest';

import { GpuError, OutOfMemoryError, ValidationError, isGpuError } from '../src/core/errors/index.js';
import {
  insertDebugMarker,
  popDebugGroup,
  pushDebugGroup,
  supportsDebugMarkers,
} from '../src/webgl2/utils/debugMarkers.js';
import {
  DisposalScope,
  alignTo,
  alignTo4,
  assert,
  assertDefined,
  assertNever,
  assertPositiveInteger,
  combineFlags,
  concatTypedArrays,
  createLogger,
  currentId,
  disposeAll,
  formatFlags,
  hasAllFlags,
  hasAnyFlag,
  hasFlag,
  isDisposable,
  isTypedArray,
  nextId,
  paddedCopy,
  resetIdCounter,
  setGlobalLogLevel,
} from '../src/utils/index.js';

describe('errors', () => {
  it('carries a stable code and a readable string form', () => {
    const error = new ValidationError('bad descriptor', { details: { binding: 3 } });
    expect(error).toBeInstanceOf(GpuError);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.name).toBe('ValidationError');
    expect(error.details).toEqual({ binding: 3 });
    expect(error.toString()).toBe('ValidationError [VALIDATION_ERROR]: bad descriptor');
    expect(isGpuError(error)).toBe(true);
  });

  it('specialises the base class', () => {
    expect(new OutOfMemoryError('too big').code).toBe('OUT_OF_MEMORY');
    expect(isGpuError(new Error('plain'))).toBe(false);
  });
});

describe('assert helpers', () => {
  it('passes through valid values', () => {
    expect(() => assert(true, 'nope')).not.toThrow();
    expect(assertDefined('value', 'missing')).toBe('value');
    expect(() => assertPositiveInteger(8, 'size')).not.toThrow();
  });

  it('throws ValidationError with the given message', () => {
    expect(() => assert(false, 'binding 3 is missing')).toThrowError(ValidationError);
    expect(() => assert(false, 'binding 3 is missing')).toThrowError('binding 3 is missing');
    expect(() => assertDefined(null, 'value missing')).toThrowError('value missing');
    expect(() => assertPositiveInteger(0, 'size')).toThrowError(/size must be a positive integer/);
    expect(() => assertNever('unexpected' as never)).toThrowError(/Unexpected value: unexpected/);
  });
});

describe('bit flags', () => {
  it('tests and formats masks', () => {
    expect(hasFlag(0b0110, 0b0010)).toBe(true);
    expect(hasFlag(0b0110, 0b0001)).toBe(false);
    expect(hasAnyFlag(0b0110, 0b0001)).toBe(false);
    expect(hasAnyFlag(0b0110, 0b0011)).toBe(true);
    expect(hasAllFlags(0b0110, 0b0110)).toBe(true);
    expect(combineFlags(0x1, 0x4, 0x8)).toBe(0x0d);
    expect(formatFlags(0, { 1: 'A' })).toBe('None');
    expect(formatFlags(0b0101, { 1: 'A', 4: 'C' })).toBe('A | C');
    expect(formatFlags(0b1001, { 1: 'A' })).toBe('A | 0x8');
  });
});

describe('typed array helpers', () => {
  it('detects typed arrays', () => {
    expect(isTypedArray(new Float32Array(1))).toBe(true);
    expect(isTypedArray(new DataView(new ArrayBuffer(4)))).toBe(false);
    expect(isTypedArray([])).toBe(false);
  });

  it('aligns values', () => {
    expect(alignTo(5, 4)).toBe(8);
    expect(alignTo(8, 4)).toBe(8);
    expect(alignTo(0, 256)).toBe(0);
    expect(alignTo(1, 256)).toBe(256);
    expect(alignTo4(5)).toBe(8);
  });

  it('produces zero padded 4-byte aligned copies', () => {
    const source = new Uint16Array([1, 2, 3]);
    const copy = paddedCopy(source);
    expect(copy.byteLength).toBe(8);
    expect(copy[0]).toBe(1);
    expect(copy[1]).toBe(0);
    expect(copy[4]).toBe(3);
    // 已经对齐的数据会复用同一块内存（不做拷贝）。
    const aligned = new Float32Array([1, 2]);
    expect(paddedCopy(aligned).buffer).toBe(aligned.buffer);
  });

  it('concatenates typed arrays of the same kind', () => {
    const result = concatTypedArrays([new Uint16Array([1, 2]), new Uint16Array([3])]);
    expect(Array.from(result)).toEqual([1, 2, 3]);
    expect(result).toBeInstanceOf(Uint16Array);
  });
});

describe('ids', () => {
  it('produces unique ids', () => {
    resetIdCounter();
    expect(nextId('buffer')).toBe('buffer#1');
    expect(nextId('buffer')).toBe('buffer#2');
    expect(nextId('texture')).toBe('texture#3');
    expect(currentId()).toBe(3);
  });
});

describe('disposal', () => {
  it('disposes tracked resources once', () => {
    const scope = new DisposalScope();
    const dispose = vi.fn();
    const resource = { disposed: false, dispose };
    scope.track(resource);
    expect(isDisposable(resource)).toBe(true);
    scope.dispose();
    scope.dispose();
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(scope.disposed).toBe(true);
    expect(() => scope.track({ disposed: false, dispose })).toThrowError(/disposed scope/);
  });

  it('reports the first failure from disposeAll', () => {
    const good = vi.fn();
    expect(() =>
      disposeAll([
        { disposed: false, dispose: good },
        {
          disposed: false,
          dispose: () => {
            throw new Error('boom');
          },
        },
      ]),
    ).toThrowError('boom');
    expect(good).toHaveBeenCalledTimes(1);
  });
});

describe('logger', () => {
  it('respects the global level', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      setGlobalLogLevel('silent');
      const logger = createLogger('test');
      logger.warn('hidden');
      expect(spy).not.toHaveBeenCalled();
      setGlobalLogLevel('warn');
      logger.warn('visible');
      expect(spy).toHaveBeenCalledWith('[test] visible');
    } finally {
      spy.mockRestore();
      setGlobalLogLevel('warn');
    }
  });
});

describe('WebGL2 调试标记（EXT_debug_marker）', () => {
  function fakeGl(extension: unknown): { gl: WebGL2RenderingContext; calls: () => number } {
    let count = 0;
    const gl = {
      getExtension: () => {
        count += 1;
        return extension;
      },
    } as unknown as WebGL2RenderingContext;
    return { gl, calls: () => count };
  }

  it('扩展不可用时是空操作，不抛错（调试标记缺失不影响渲染）', () => {
    const { gl } = fakeGl(null);
    expect(supportsDebugMarkers(gl)).toBe(false);
    expect(() => {
      pushDebugGroup(gl, 'frame');
      insertDebugMarker(gl, 'draw');
      popDebugGroup(gl);
    }).not.toThrow();
  });

  it('扩展可用时转发给 glPushGroupMarkerEXT 等入口', () => {
    const log: string[] = [];
    const { gl } = fakeGl({
      pushGroupMarkerEXT: (marker: string) => log.push(`push:${marker}`),
      popGroupMarkerEXT: () => log.push('pop'),
      insertEventMarkerEXT: (marker: string) => log.push(`marker:${marker}`),
    });

    expect(supportsDebugMarkers(gl)).toBe(true);
    pushDebugGroup(gl, '一帧');
    insertDebugMarker(gl, '某次 draw');
    popDebugGroup(gl);
    expect(log).toEqual(['push:一帧', 'marker:某次 draw', 'pop']);
  });

  it('每个 GL context 只查一次扩展（不会每次 push 都 getExtension）', () => {
    const { gl, calls } = fakeGl(null);
    pushDebugGroup(gl, 'a');
    popDebugGroup(gl);
    insertDebugMarker(gl, 'b');
    expect(calls()).toBe(1);
  });
});
