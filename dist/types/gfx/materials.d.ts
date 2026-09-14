/**
 * 内置材质：开箱即用的几种常用着色�? *
 * 每个函数返回的是**材质描述**（{@link MaterialDesc}），交给
 * `renderer.createMaterial(...)` �?`defineMaterial(...)` 使用�? *
 * ```ts
 * const lambert = renderer.createMaterial(materials.lambert({ color: [1, 0.6, 0.2, 1] }));
 * ```
 *
 * 所有内置材质共用同一套「场景字段」（`projectionView` / `model` / `normalMatrix`），
 * 渲染器会自动填充它们；材质各自额外的字段（颜色、光向…）由使用者通过
 * `renderer.draw(geometry, { uniforms: { ... } })` �?`material.createUniforms()` 覆盖�? *
 * 每种材质�?GLSL �?WGSL 都成对写好，**访问名保持一�?*（`u.*` �?`v.*`），
 * 所以同一份材质描述在 WebGL2 �?WebGPU 上表现相同�? */
import type { MaterialDesc } from './Material.js';
/** 颜色写法：`[r, g, b]` �?`[r, g, b, a]`，取�?0..1�?*/
export type RgbColor = readonly [number, number, number] | readonly [number, number, number, number];
/** 所有内置材质共同依赖的场景字段�?*/
export declare const SCENE_UNIFORM_FIELDS: {
    readonly projectionView: "mat4x4f";
    readonly model: "mat4x4f";
    /** 模型矩阵左上 3x3 的逆转置；非等比缩放下变换法线必须用它�?*/
    readonly normalMatrix: "mat3x3f";
};
/** 平行光的方向与颜色�?*/
export interface LightOptions {
    /** 光的方向（从物体指向光源），会归一化。默�?`[0.5, 1, 0.6]`�?*/
    direction?: readonly [number, number, number];
    /** 环境光强度，0..1。默�?0.18�?*/
    ambient?: number;
}
export interface UnlitOptions {
    color?: RgbColor;
}
/** 纯色（不受光照影响）�?*/
export declare function unlit(options?: UnlitOptions): MaterialDesc;
export interface LambertOptions extends LightOptions {
    color?: RgbColor;
}
/** 兰伯特漫反射�? 环境光）�?*/
export declare function lambert(options?: LambertOptions): MaterialDesc;
export interface PhongOptions extends LightOptions {
    color?: RgbColor;
    /** 高光颜色。默认偏白�?*/
    specular?: RgbColor;
    /** 高光指数，越大越集中。默�?48�?*/
    shininess?: number;
}
/** 兰伯�?+ Blinn-Phong 高光�?*/
export declare function phong(options?: PhongOptions): MaterialDesc;
/** 用法线方向当颜色，用来检查朝向与是否法线出错�?*/
export declare function normalDebug(): MaterialDesc;
/** 线框/网格线的颜色（配�?`line-list` 拓扑使用）�?*/
export interface FlatLineOptions {
    color?: RgbColor;
    /** 颜色是否随距离衰减（网格线用）。默�?`true`�?*/
    fadeWithDistance?: boolean;
}
/**
 * 纯色线段材质，用于网格线、坐标轴这类 LineData�? *
 * 与其它内置材质的区别：它�?`uv` 作为「衰减因子」（�?`createGrid`/`createAxes` 生成�? * 顶点色提供），所以属性只有一�?`position` 与一�?`uv`�? */
export declare function flatLine(options?: FlatLineOptions): MaterialDesc;
/**
 * 带顶点色的线段材质：顶点色来自几何体�?`color` 属性�? * `createGrid` / `createAxes` 生成的数据就是给它的（远端渐隐、坐标轴三色）�? */
export declare function vertexColorLine(): MaterialDesc;
/** 内置材质集合，便于整体引用�?*/
export declare const materials: {
    readonly unlit: typeof unlit;
    readonly lambert: typeof lambert;
    readonly phong: typeof phong;
    readonly normalDebug: typeof normalDebug;
    readonly flatLine: typeof flatLine;
    readonly vertexColorLine: typeof vertexColorLine;
};
/** 取出材质描述里携带的默认 uniform 值�?*/
export declare function defaultUniformsOf(desc: MaterialDesc): Record<string, number | ArrayLike<number>>;
//# sourceMappingURL=materials.d.ts.map