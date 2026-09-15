/**
 * core 层示例：**一片风景**（天空 / 太阳 / 两层山脊 / 实例化树林 / 清澈的河）。
 *
 * 这一页是 core 层目前最长的一个例子，因为它要证明的是「多通道 + 多管线 + 透明混合」
 * 这些在便捷层里被包起来的东西，用 core 的原始 API 一样写得清楚：
 *
 * - **天空**：一个覆盖裁剪空间的大三角形（`gl_Position = vec4(位置, 1)`），
 *   在片元里按**视线方向**做地平线→天顶的渐变，所以整个视口必然被铺满 ——
 *   清屏色（`CLEAR = 0.72, 0.10, 0.62`）一像素都不会露出来（它只是兜底，
 *   同时也是一把「这里什么都没画」的标尺：`scripts/analyze-screenshot.mjs --clear`）。
 * - **太阳**：亮盘 + 两层辉光都在天空着色器里算（`cos` 的幂次控制宽度）。
 *   同一个 `sunDirection` 又被山脊 / 地形 / 树林 / 河面的漫反射与镜面高光复用 ——
 *   太阳就是主光源；自检里「最亮的那一小块就在主光方向投影出来的位置上」这条判据
 *   把这两件事绑在一起（`sun-aligned`）。
 * - **山**：两层「屏幕空间幕布」网格。上下边界由**屏幕位置反解**出世界高度
 *   （{@link screenRowHeight}），所以山脊稳定地占屏幕上该占的那一段：远山脊线 0.17、
 *   近山 0.27（都在地平线 0.33 之上，是「比相机高的山」），地形远端的轮廓在 0.35 把下面接上。
 * - **树林**：树干与树冠各一个网格，每棵树的**世界坐标 + 缩放 + 旋转走进实例缓冲**
 *   （`stepMode: 'instance'`），于是 500 多棵树只有 **2 次 draw call**。
 * - **河**：先画**河床**（走廊网格：河底 + 两侧沙滩），再画**水面**：
 *   `blend + depthWriteEnabled:false`，片元里用 fresnel 把「水色 / 天空反射」混合 ——
 *   垂直看更透明（看得见河床的砂砾），掠射角更反射天空，再叠一层随时间流动的波纹高光。
 *
 * 管线一共 6 条（天空 / 山脊 / 地形 / 河床 / 树木 / 水面），一帧 8 次 draw call。
 *
 * 查询参数：
 * `?backend=webgl2|webgpu|auto&verify=1&gui=0&t=<秒>&sun=<仰角弧度>&water=<透明度 0..1>&wspin=0`
 * 调试用：`?only=sky|ridge|terrain|bed|tree|water`（只画一层）、`?ridges=0|1|2`、`?fog=0`、`?wire=1`。
 *
 * **两个后端必须都过**：`?verify=1` 会往 `data-landscape*` 里写分区探针与 8 条判据，
 * 其中 `landscapeChecks` 要列全、`landscapeFailed` 要为空。探针的分区不是手工估的百分比，
 * 而是**由几何算出来的**（太阳用 `sunDirection` 投影，河面用河道中心线投影）——
 * 这样探针才会跟着场景走，不会因为换了相机或画布宽高比就打在别的东西上。
 */

import GUI from 'lil-gui';

import { BufferUsage, TextureUsage, mat4, vec3 } from '../src/index.js';
import {
  backendFromQuery,
  createCoreExample,
  createUniformBinding,
  reportVerify,
  requireElement,
  setData,
  startFrameLoop,
  verifyOffscreen,
} from './core-shared.js';
import type { Device } from '../src/core/Device.js';
import type { RenderPassEncoder } from '../src/core/render/RenderPassEncoder.js';

/* ------------------------------------------------------------------------------------------------ */
/* 常量                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

/**
 * 清屏色：**故意选了一个和天空差得很远的颜色**。
 * 天空三角形铺满视口后它根本不可见；正因为它不可见，「截图中出现这个颜色」就成了
 * 「天空没铺满」的硬证据（`scripts/analyze-screenshot.mjs --clear 0.72,0.10,0.62`）。
 */
const CLEAR: readonly [number, number, number, number] = [0.72, 0.1, 0.62, 1];

/**
 * uniform 块的字节布局（**必须与 WGSL 那边的 `struct Uniforms` 完全一致**）：
 *
 * | 字段 | 偏移 |
 * | --- | --- |
 * | `viewProjection` mat4 | 0 |
 * | `inverseViewProjection` mat4 | 64 |
 * | `cameraPosition` vec4 | 128 |
 * | `sunDirection` vec4 | 144（xyz 是单位方向，w 留作强度） |
 * | `timeAndFog` vec4 | 160（x 时间、y 雾浓度、z 山脊雾系数、w 线框开关） |
 * | `water` vec4 | 176（x 透明度、y 反射强度） |
 *
 * 一共 192 字节。注意 WGSL 的 `mat4x4f` 需要 16 字节对齐，所以两个 mat4 之间没有空隙，
 * 但**第一个 mat4 之后的东西不能紧挨着放**（这正是上一版按 112 字节申请、`set()` 越界的坑）。
 */
const UNIFORM_BYTES = 192;
/**
 * 离屏自检的高度（像素）。宽度按**画布当前的宽高比**算（见 verify 段），
 * 这样归一化坐标在离屏图与画布上指的是同一个位置 —— 探针才能用「太阳投影出来的屏幕位置」去定位。
 */
const VERIFY_HEIGHT = 270;

/**
 * 相机：**贴近水面高度的河岸视角**（世界尺度很小：河宽约 5 单位、树高约 1~2 单位）。
 *
 * 相机高 8、目标点在 36 单位外低 4.5 个单位 → 俯角 `atan(4.5/36) ≈ 7.1°`，于是：
 * - 地平线落在 `y = 0.5 - 7.1°/42° ≈ 0.33`，天空占上面三分之一；
 * - 画面底边对应的地面深度是 `8 / tan(7.1° + 21°) ≈ 15` 单位，即「脚下最近的岸」；
 * - 地形一直铺到 430 单位，它的远端轮廓落在 `y ≈ 0.35`（地平线稍下方）；
 * - 两层山脊是**比相机更高的山**，所以脊线出现在地平线**上方**（`y = 0.17 / 0.27`），
 *   正好补上「地形轮廓 → 地平线」之间那条细缝，天空与太阳依然露在最上面。
 *
 * 这几个数字是**量出来的**：相机太低（例如 y = 3）时河岸的抬升在屏幕上占掉的夹角太大，
 * 天空会被整块盖住；只看不做屏幕位置反解的话，山脊又会一路铺到屏幕顶。
 */
const CAMERA_EYE: readonly [number, number, number] = [0, 8, 6];
const CAMERA_TARGET: readonly [number, number, number] = [0, 3.5, -30];
/**
 * 河岸在远端的抬升高度。
 *
 * 0.4 是量出来的：相机高 8 时远端（430 单位）的岸高约 0.7~1.8，屏幕上落在 `y ≈ 0.35`，
 * 正好接住地平线；地形于是占 `y = 0.35 ~ 1` 这一段。
 */
const TERRAIN_RISE = 0.4;
/** 河岸的基础抬升（近端的岸高就是它 + 噪声）。 */
const TERRAIN_BASE = 0.3;
/**
 * 河岸起伏噪声的**振幅**（世界单位）与频率。
 *
 * 振幅 2.6 是量出来的：地形是斜着看的，低于 1 的起伏在屏幕上只有几个像素，
 * 整片会读成一块平板；2.6 让近处的岸有明确的起伏，同时最高处（0.3 + 2.6）仍远低于相机高 8，
 * 不会挡住远处的视线。频率 0.018 对应约 55 单位的波长，画面里正好是「一坡接一坡」。
 */
const TERRAIN_NOISE_AMPLITUDE = 2.6;
const TERRAIN_NOISE_FREQUENCY = 0.018;
const FOV = (42 * Math.PI) / 180;
const NEAR_PLANE = 0.1;
const FAR_PLANE = 1200;

/** 河面高度：地形在这里被切出河道，低于它的部分就是河床。 */
const WATER_LEVEL = 0;
/** 地形网格的近端深度（相机在 z=+6，所以这里约等于「脚下」）。 */
const TERRAIN_NEAR = 8;
/** 地形网格的远端深度：远到被雾吃掉、和山脊接上。 */
const TERRAIN_FAR = 430;
/** 地形沿深度的行数（行距按 v^TERRAIN_V_POWER 拉开：近处密、远处疏）。 */
const TERRAIN_ROWS = 46;
const TERRAIN_V_POWER = 0.72;
/** 地形每行的横向列数（列在哪由 hash 决定，见 {@link buildTerrainMesh}）。 */
const TERRAIN_COLS = 58;

/** 山脊的一层：深度、幕布底边/脊线的屏幕位置、起伏相位与频率、颜色、雾强度。 */
interface RidgeSpec {
  readonly depth: number;
  /**
   * 幕布的**底边在屏幕上的位置**（0 顶 1 底）。
   *
   * 这里刻意不写「世界高度」：山脊的上下边界在屏幕上是什么位置，取决于相机高度与俯角，
   * 用固定世界高度会让远山与近山互相错位（实测远山一路铺到屏幕顶、整屏一个颜色）。
   * 用一个屏幕比例当输入，再由 {@link screenRowHeight} 反解出世界高度，山脊才会稳定地落在该在的位置。
   */
  readonly baseScreen: number;
  /** 脊线（最高峰）的**屏幕位置**（同上，反解成世界高度）。 */
  readonly peakScreen: number;
  readonly scale: number;
  readonly phase: number;
  /**
   * 脊线起伏的空间频率（每世界单位多少弧度）。
   *
   * 必须与幕布的宽度匹配：频率太低（旧版的 0.0125）时整块幕布里只有半个波，
   * 屏幕上就是「一条平顶的深色板子」。两层各自按可见半宽取值，画面里各有 6~9 个山头。
   */
  readonly frequency: number;
  readonly color: readonly [number, number, number];
  readonly haze: number;
}

/**
 * 两层山脊。
 *
 * 输入是**屏幕位置**（`baseScreen` / `peakScreen`），世界高度由 {@link screenRowHeight} 反解：
 * 屏幕上 `y` 处的视线俯角是 `pitch + (y - 0.5) × FOV`，该处的世界高度是
 * `相机高 - 深度 × tan(俯角)`。
 *
 * - 远山：320 单位外，脊线 0.17（**在地平线 0.33 上方**，因为山比相机高得多）、
 *   底边 0.42（已经埋进地形里，所以看不到生硬的底边），颜色偏冷、雾最重 → 淡蓝的远山。
 * - 近山：120 单位外，脊线 0.27、底边 0.50，颜色深绿、雾很轻 → 深色的近处山体。
 *
 * 两层脊线都在地平线以上、在天空里，所以「山脊比天空暗」这条判据有东西可量；
 * 而地形远端的轮廓在 0.35，正好补上近山脊线（0.27）以下的那一段，不会露出清屏色。
 */
const RIDGES: readonly RidgeSpec[] = [
  { depth: 320, baseScreen: 0.42, peakScreen: 0.17, scale: 46, phase: 0.0, frequency: 0.055, color: [0.46, 0.53, 0.64], haze: 1.0 },
  { depth: 120, baseScreen: 0.5, peakScreen: 0.27, scale: 17, phase: 2.3, frequency: 0.15, color: [0.18, 0.27, 0.23], haze: 0.4 },
];

/**
 * 山脊幕布网格的规模（列 × 行）。列在**世界坐标**上怎么分布见 {@link buildRidgeMesh}。
 */
const RIDGE_COLS = 190;
const RIDGE_ROWS = 5;

/**
 * 一层山脊的「幕布」在世界坐标里铺多宽（世界单位，沿 x 关于相机轴对称）。
 *
 * 这个数字是**按可见范围反解**的：深度 `d` 处画面左右边缘对应的世界半宽是
 * `d × tan(FOV/2) × 宽高比`。宽高比会随窗口变（截图的画布是 2.18），取 1.25 倍的深度
 * 对到 3.4 的宽高比都还有余量，幕布边缘一定落在画面之外 —— 否则幕布会在屏幕里“断掉”，
 * 两端露出竖直的边（旧版用 0.677 倍深度，实测近山就是一个带竖直边的深色方块）。
 */
function ridgeHalfWidth(depth: number): number {
  return Math.max(1.25 * depth, 12);
}

/**
 * 河床 / 河面网格：**沿屏幕高度**铺 56 行、横向 22 列的带状网格（见 {@link riverDepthAtRow}）。
 *
 * 网格顶行取在 `y = 0.36`（地形远端轮廓 0.35 的稍下方）：再往上就没有地面了，
 * 那些行会全部挤在同一个深度上。底行是画面底边 `y = 1`，对应的深度约 15 单位。
 */
const RIVER_ROWS = 56;
const RIVER_COLS = 22;
/** 河道网格的顶行（屏幕比例）：略低于地平线，保证每一行都真的落在地面上。 */
const RIVER_TOP_SCREEN = 0.36;
/**
 * 河道在深度方向的截止（世界单位）。
 *
 * 河床 / 水面网格只铺到约 370 单位（`RIVER_TOP_SCREEN` 那一行），所以地形**必须在 360 单位
 * 之后停止挖河道** —— 否则地形会在网格够不到的地方留下一个洞，清屏色（184,26,158）会直接
 * 从洞里露出来。这一条是「按可见范围裁剪」的另一半：挖河道的范围与走廊网格的范围必须对齐。
 */
const RIVER_DEPTH_LIMIT = 360;

/** 树林：目标棵数（`?trees=` 调，上限见 {@link MAX_TREES}）。 */
const TREE_COUNT = 520;
const MAX_TREES = 4000;

/**
 * 雾的三段式系数（**这一版专门修过一次**）。
 *
 * `params.fog`（`timeAndFog.y`）是「每单位距离的浓度」，数量级是 4e-4；而上一版把它整条丢在一边，
 * 往 `fogMix` 里塞的是 `timeAndFog.z`（0.4 ~ 1.0）这种「混合比例」量级的数 —— 于是
 * `1 - exp(-d × 0.4)` 在 10 个单位处就饱和，地形延伸到 430 单位，全屏被 `SKY_HORIZON`
 * 一刀切成 158,173,178 一块平色，五个元素都认不出来。
 *
 * 现在的契约恢复成：**真实浓度 = `timeAndFog.y × timeAndFog.z × 每层系数`**，其中 `z` 只是
 * 「这一层吃多少雾」的倍率，`fogDensity()`（GLSL / WGSL 各一份，见下面）统一负责乘法。
 * 每层系数是量出来的观感值：地形 1.0、河床 0.75、树 0.7、水面 0.45（远处的水也要看得出是一条河）。
 *
 * **浓度的量级也是量出来的**：默认值 0.0016 让 430 单位处混入 `1 - exp(-0.69) ≈ 50%`
 * 的地平线色（远处的地形淡出、和天空接上），而 100 单位以内只有 15%（近岸依然清晰）。
 * 旧版的 4e-4 太淡：远山只吃到 9% 的雾，看起来和近山一样是硬邦邦的深色，
 * 两层山脊在画面里分不出远近。
 */
const FOG_TERRAIN_SCALE = 1;
/** 河床：比地形略淡，河床色要被水面透出来。 */
const FOG_BED_SCALE = 0.75;
/** 树林：比地形略淡，树的绿色是画面的主要色块。 */
const FOG_TREE_SCALE = 0.7;
/** 水面：雾最淡 —— 远处的水也要看得出「这是一条河」。 */
const FOG_WATER_SCALE = 0.45;
/** 默认雾浓度（每单位距离）：见上面量出来的 0.0016。 */
const FOG_DEFAULT = 0.0016;

/* ------------------------------------------------------------------------------------------------ */
/* 共用 GLSL 片段（噪声 / 雾 / 天空）                                                                    */
/* ------------------------------------------------------------------------------------------------ */

/**
 * 把 TS 里的数字写成 GLSL 的浮点字面量。
 *
 * GLSL ES 3.0 **不做整数字面量的隐式转换**：`1 * 2.5` 是编译错误，必须写 `1.0 * 2.5`。
 * 插件模板里 `${1}` 会得到 `1`，所以凡是要拼进着色器的常量都过一遍这个函数。
 */
function glslFloat(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : String(value);
}

/** 雾的每层系数拼进 GLSL 时的浮点字面量（理由见 {@link glslFloat}）。 */
const FOG_TERRAIN_SCALE_GLSL = glslFloat(FOG_TERRAIN_SCALE);
const FOG_BED_SCALE_GLSL = glslFloat(FOG_BED_SCALE);
const FOG_TREE_SCALE_GLSL = glslFloat(FOG_TREE_SCALE);
const FOG_WATER_SCALE_GLSL = glslFloat(FOG_WATER_SCALE);

/**
 * 河道走廊的参数（**必须在着色器模板字符串之前声明** —— 模板在模块求值时就会读它们）。
 *
 * 河道宽度与摆动幅度**都正比于深度**是旧版最致命的比例错误：到了 `TERRAIN_FAR = 430`
 * 的远端就变成「45 单位宽、摆动 ±100 单位」的巨物，河被整个甩出画面（`?only=bed` 时 76%
 * 的像素是清屏色），而近处又窄到只剩几个像素。现在两者共用一个**收敛尺度**
 * {@link RIVER_MEANDER_CAP}：近处照旧按深度张开，远处稳定在「半宽 2.73 单位」的一条河。
 */
/** 河道宽度占「该深度可见半宽」的比例（可见半宽 ≈ `0.615 × 深度`）。 */
const RIVER_WIDTH_RATIO = 0.105;
/**
 * 摆动幅度 / 河道宽度的收敛尺度（世界单位）。
 *
 * 26 是量出来的：`0.105 × 26 ≈ 2.73` → **河最宽处半宽 2.73 单位**，站在 5 单位高的岸上看，
 * 大约占画面宽度的 15% —— 一条一眼能认出来的河。旧版没有这个上限，远端会到 45 单位。
 */
const RIVER_MEANDER_CAP = 26;
/**
 * 河道走廊的横向范围（单位：该深度的河道半宽）。
 *
 * 走廊是**一整块连续曲面**：左右两端的高度**等于地形的岸高**（同一份高度函数、同一个 `x`），
 * 往中间平滑下潜到河床。地形在 `channelWeight > 0.02`（即横向 < 0.956）处 discard，
 * 而走廊铺到 ±1.05，于是**河道那块缺口一定被走廊盖住**，不会被地形三角面切成碎块 ——
 * 这一点很重要：地形是「格距正比于深度」的粗网格，远端一个格子有 3 个单位宽，
 * 光靠 discard 自己切不出一条干净的河。
 */
const RIVER_BED_SIDE = 1.05;
/** 走廊水底完全平坦的横向范围（0 = 正中，1 = 走廊边缘）。 */
const RIVER_BED_FLAT = 0.5;
/**
 * 河床相对水面的深度（世界单位，水面在 `WATER_LEVEL = 0`）。
 *
 * 0.9 是量出来的：再浅的话水面在屏幕上会宽到压掉两岸的沙滩，再深则透过水面看到的
 * 河床会被压暗到看不出砂石质感。
 */
const RIVER_BED_DEPTH = -0.9;
/**
 * 河道剖面的过渡曲线：横向参数 `t` 从 {@link RIVER_BED_FLAT} 到 1（岸）之间用它平滑上升。
 *
 * **必须让 `t = 1` 处严格等于岸高** —— 上一版的公式 `-0.9 + (岸高 + 0.9) × climb × (1 - lateral^p)`
 * 在 `lateral = 1` 处回到 `-0.9`，也就是走廊的两端比岸低 2 米，河两岸各有一条沟；
 * 现在改成 `河床底 + (岸高 - 河床底) × smoothstep(...)`，端点值天然就是岸高，拼缝严丝合缝。
 */
function riverBankRise(lateral: number): number {
  const t = Math.min(Math.max((lateral - RIVER_BED_FLAT) / (1 - RIVER_BED_FLAT), 0), 1);
  return smoothstep(0, 1, t);
}


/**
 * uniform 块在 GLSL 里是**逐 stage 声明**的：片元着色器用到的字段必须在片元着色器里
 * 再写一遍（两个后端都要求这么做，`core-box.ts` 也是同一份写法）。
 */
const UNIFORM_BLOCK_GLSL = `
layout(std140) uniform Uniforms {
  mat4 viewProjection;
  mat4 inverseViewProjection;
  vec4 cameraPosition;
  vec4 sunDirection;
  vec4 timeAndFog;
  vec4 water;
} u;
`;


/** 与 GLSL 对应的 WGSL 常量与函数（入口不同、语言不同，公式逐行一致）。 */
const WGSL_COMMON = `
const SKY_HORIZON: vec3f = vec3f(0.62, 0.68, 0.7);
const SKY_ZENITH: vec3f = vec3f(0.14, 0.36, 0.74);

fn hash11(p: f32) -> f32 {
  var q = fract(p * 0.1031);
  q = q * (q + 33.33);
  q = q * (q + q);
  return fract(q);
}

fn hash21(p: vec2f) -> f32 {
  var q = fract(vec3f(p.x, p.y, p.x) * vec3f(0.1031, 0.1030, 0.0973));
  q = q + dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

fn valueNoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fbm3(p: vec2f) -> f32 {
  var total = 0.0;
  var amplitude = 0.5;
  var point = p;
  for (var i = 0; i < 3; i = i + 1) {
    total = total + valueNoise(point) * amplitude;
    point = point * 2.07 + vec2f(13.1, 7.3);
    amplitude = amplitude * 0.5;
  }
  return total;
}

fn gridLines(position: vec2f) -> f32 {
  let width = max(fwidth(position), vec2f(0.0001));
  let grid = abs(fract(position - 0.5) - 0.5) / width;
  return 1.0 - clamp(min(grid.x, grid.y), 0.0, 1.0);
}

fn fogMix(color: vec3f, distanceToCamera: f32, density: f32) -> vec3f {
  return mix(color, SKY_HORIZON, 1.0 - exp(-distanceToCamera * density));
}

fn fogDensity(hazeScale: f32) -> f32 {
  return u.timeAndFog.y * u.timeAndFog.z * hazeScale;
}

`;

/* ------------------------------------------------------------------------------------------------ */
/* 天空                                                                                                */
/* ------------------------------------------------------------------------------------------------ */

/** 天空基色：地平线（暖）与天顶（蓝）写在 GLSL 里，WGSL 那边是 {@link WGSL_COMMON} 的同名常量。 */
const SKY_COLORS_GLSL = `
const vec3 SKY_HORIZON = vec3(0.62, 0.68, 0.7);
const vec3 SKY_ZENITH = vec3(0.14, 0.36, 0.74);
`;

/**
 * 哈希与噪声：全部是**确定性的**，不依赖任何外部数据或随机种子 —— 每帧、每次刷新
 * 生成的几何体与颜色都一样，截图才能比对。
 *
 * 局部的 `fade` 变量名不能叫 `u`：`u` 是下面 uniform 块的名字，局部变量会把它遮住。
 */
const SHADER_COMMON_GLSL = `
float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 fade = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, fade.x), mix(c, d, fade.x), fade.y);
}

float fbm3(vec2 p) {
  float total = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    total += valueNoise(p) * amplitude;
    p = p * 2.07 + vec2(13.1, 7.3);
    amplitude *= 0.5;
  }
  return total;
}

`;

/**
 * 只有片元着色器能用的部分：`fwidth` 是**导数函数**，在顶点着色器里 GLSL ES 3.0 不允许
 * （所以它不能放进 {@link COMMON_GLSL}，否则天空的顶点着色器会编译失败）。
 */
const FRAGMENT_ONLY_GLSL = `
// 屏幕细网格：只给「线框」调试开关用。
float gridLines(vec2 position) {
  vec2 grid = abs(fract(position - 0.5) - 0.5) / max(fwidth(position), vec2(0.0001));
  return 1.0 - clamp(min(grid.x, grid.y), 0.0, 1.0);
}
`;

/**
 * 雾：真浓度 = `timeAndFog.y`（每单位距离的浓度）× `timeAndFog.z`（这一层吃多少雾）× `hazeScale`。
 *
 * 拆成 `fogDensity()` 与 `fogMix()` 两步是刻意的：上一版把「雾的强度倍率」（0.4~1.0）
 * 直接当成了「浓度」传进 `fogMix`，于是 `1 - exp(-d × 0.4)` 在 10 个单位处就饱和，
 * 430 个单位深的地形整片混成 `SKY_HORIZON` —— 画面退化成一块 158,173,178 的平色。
 * 现在调用点只负责给「倍率」，乘 `y` 这件事在 `fogDensity()` 里统一做，不会再漏。
 *
 * 顺带一个量级提醒：`SKY_HORIZON` 是 0.62/0.68/0.7，和 `CLEAR`（0.72/0.10/0.62）差得很远，
 * 所以截图里只要看到清屏色就说明那一块**什么都没画**；而「雾太浓」的表现是整片变成
 * 天空地平线色 —— 两种症状一眼就能分开。
 */
const FOG_GLSL = `
vec3 fogMix(vec3 color, float distanceToCamera, float density) {
  return mix(color, SKY_HORIZON, 1.0 - exp(-distanceToCamera * density));
}

// 「这一层吃多少雾」→ 真实浓度。
float fogDensity(float hazeScale) {
  return u.timeAndFog.y * u.timeAndFog.z * hazeScale;
}
`;

/**
 * 走廊的地面高度与法线（与 riverProfileHeight **数值一致**）。
 *
 * 着色器里要用它重算法线，所以公式必须是同一份 —— 上一版这里两边不一致：
 * CPU 网格用「河床 + 岸坡」的连续剖面，着色器的高度函数却是另一套混法，后者在河道边缘会产生
 * 一道**近乎垂直的崖壁**，于是地形的法线全变成水平的，漫反射直接被压成黑色（实测 2,2,2）。
 * 现在地形只认平坦的岸高，河道形状全部由走廊网格自己负责。
 */
const LANDSCAPE_HELPERS_GLSL = `
// 河道走廊的参数：与 buildRiverMesh 里的常量逐字对应。
const float RIVER_BED_SIDE = ${RIVER_BED_SIDE};
const float RIVER_BED_FLAT = ${RIVER_BED_FLAT};
const float RIVER_BED_DEPTH = ${RIVER_BED_DEPTH.toFixed(2)};

// 注意末尾的 .0：GLSL ES 3.0 里整数字面量**不能**隐式转成 float，
// 写成 26 会直接编译失败（着色器编译错误比画面全黑更难查，这里踩过一次）。
const float RIVER_MEANDER_CAP = ${RIVER_MEANDER_CAP.toFixed(1)};

// 「按有限深度收敛」的尺度：旧版这里直接乘 depth，远端河道宽到 45 单位、摆动 ±100 单位，
// 河被甩出画面 —— 现在近处照旧张开、远处收敛成稳定的一条窄带。
float meanderScale(float depth) {
  float d = max(depth, 4.0);
  return RIVER_MEANDER_CAP * (1.0 - exp(-d / RIVER_MEANDER_CAP));
}

float channelHalfWidth(float depth) {
  return 0.105 * meanderScale(depth);
}

float meanderOffset(float z, float depth) {
  return (sin(z * 0.021) * 0.34 + sin(z * 0.0073) * 0.55) * meanderScale(depth);
}

// 河道在深度方向的截止：比 ${RIVER_TOP_SCREEN.toFixed(2)} 那一行（约 370 单位）更远的地方
// **不再挖河道**，否则地形会在走廊网格够不到的地方留下一个洞（清屏色会直接露出来）。
const float RIVER_DEPTH_LIMIT = 360.0;

float channelWeight(vec2 p) {
  float depth = max(u.cameraPosition.z - p.y, 4.0);
  float halfWidth = channelHalfWidth(depth);
  float meander = meanderOffset(p.y, depth);
  float lateral = abs(p.x - meander) / halfWidth;
  float cut = 1.0 - smoothstep(0.62, 1.0, lateral);
  return cut * (1.0 - smoothstep(RIVER_DEPTH_LIMIT - 40.0, RIVER_DEPTH_LIMIT, depth));
}

/**
 * 河岸高度（**不含河道**）：与 CPU 的 terrainHeightCpu 逐字对应。
 *
 * 抬升用 TERRAIN_RISE 而不是写死的 5 单位：写死的话远端地面过高会把天空整块盖住。
 * 那一项是构图的关键：它决定地形远端的轮廓落在屏幕的哪一行。
 *
 * 河道那一段剖面由**河床走廊网格**负责（见 buildRiverMesh），地形片元在 channelWeight > 0.02
 * 处整块 discard，所以两边不会互相打架。
 */
float terrainHeight(vec2 p) {
  float depth = max(u.cameraPosition.z - p.y, 4.0);
  return (depth / 430.0) * ${TERRAIN_RISE.toFixed(2)} + ${TERRAIN_BASE.toFixed(2)}
    + fbm3(p * ${TERRAIN_NOISE_FREQUENCY.toFixed(3)}) * ${TERRAIN_NOISE_AMPLITUDE.toFixed(2)};
}
`;

const COMMON_GLSL = `${UNIFORM_BLOCK_GLSL}
${SKY_COLORS_GLSL}
${SHADER_COMMON_GLSL}
${FOG_GLSL}
${LANDSCAPE_HELPERS_GLSL}`;

/** 片元着色器专用前缀：{@link COMMON_GLSL} + 依赖导数的网格函数。 */
const COMMON_FRAGMENT_GLSL = `${COMMON_GLSL}
${FRAGMENT_ONLY_GLSL}`;

const SKY_VERTEX_GLSL = `
layout(location = 0) in vec3 position;

${COMMON_GLSL}

out vec3 vRay;

void main() {
  // 逆矩阵的 w 分量给出「该屏幕位置对应的方向的齐次系数」，除以它才是真正的视线方向。
  // 注意：WebGPU 的逆矩阵是同一个（投影部分两后端的零到一区别已经包含在里面）。
  vec4 point = u.inverseViewProjection * vec4(position, 1.0);
  vRay = point.xyz / point.w - u.cameraPosition.xyz;
  gl_Position = vec4(position, 1.0);
}
`;

const SKY_FRAGMENT_GLSL = `
in vec3 vRay;

layout(location = 0) out vec4 fragColor;

${COMMON_FRAGMENT_GLSL}

void main() {
  vec3 ray = normalize(vRay);
  vec3 sun = normalize(u.sunDirection.xyz);
  float height = clamp(ray.y, -1.0, 1.0);
  // 渐变参数用 **clamp 到 0 的** 高度：地平线以下不再继续往暗处插值，
  // 否则地形远边界之外漏出来的那点天空会比地平线色暗，露出「两个地平线」的拼缝。
  float lift = clamp(height, 0.0, 1.0);

  // 地平线偏暖 → 天顶偏蓝。指数 0.35 是量出来的：这台相机只往上看了约 14°（lift ≤ 0.25），
  // 用 0.5 甚至 1.0 时「天顶蓝」根本来不及出现，整个天空会是一片没有渐变的灰白。
  vec3 color = mix(SKY_HORIZON, SKY_ZENITH, pow(lift, 0.35));
  // 贴着地平线的一层暖白（大气散射的廉价近似）。用 exp(-lift × k) 而不是 pow(1 - |2·lift - 1|)：
  // 后者的峰值在 lift = 0.5（画面正中的天上），地平线附近反而恒等于 0，等于什么都没加。
  color += vec3(0.17, 0.14, 0.08) * exp(-lift * 13.0);

  // 太阳：本体 + 两层辉光。宽度由 cos 的幂次控制。
  // 幂次是量出来的：旧版用 320 / 14 / 3，而「视线与太阳夹角 20°」处 cos = 0.94，
  // 0.94³ = 0.83 → 远晕把整片天空都提亮到 240 以上（实测天空上沿 233,243,255，
  // 看不出任何渐变）。现在 4000 / 220 / 22：圆盘角半径约 1.1°（屏幕上直径约 23 像素，
  // 5×5 的探针稳稳压在盘里），20° 处只剩 0.05 的余量，天空恢复成蓝色渐变。
  float sunAngle = max(dot(ray, sun), 0.0);
  color += vec3(2.6, 2.45, 2.1) * pow(sunAngle, 4000.0);  // 本体：一个很亮的圆盘
  color += vec3(0.55, 0.45, 0.30) * pow(sunAngle, 220.0); // 近晕
  color += vec3(0.20, 0.16, 0.10) * pow(sunAngle, 22.0);  // 远晕

  // 天空**不吃雾**：它本身就是要和地平线色接上的那一层，再混一次雾只会把
  // 地平线→天顶的渐变压平（上一版整片天空被雾压成 158,173,178 一块平色）。
  fragColor = vec4(color, 1.0);
}
`;

const SKY_WGSL = `
struct Uniforms {
  viewProjection: mat4x4f,
  inverseViewProjection: mat4x4f,
  cameraPosition: vec4f,
  sunDirection: vec4f,
  timeAndFog: vec4f,
  water: vec4f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

${WGSL_COMMON}

struct SkyVertexInput {
  @location(0) position: vec3f,
}

struct SkyVertexOutput {
  @builtin(position) position: vec4f,
  @location(0) ray: vec3f,
}

@vertex fn vsMain(v: SkyVertexInput) -> SkyVertexOutput {
  var out: SkyVertexOutput;
  let point = u.inverseViewProjection * vec4f(v.position, 1.0);
  out.ray = point.xyz / point.w - u.cameraPosition.xyz;
  out.position = vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain(in: SkyVertexOutput) -> @location(0) vec4f {
  let ray = normalize(in.ray);
  let sun = normalize(u.sunDirection.xyz);
  let height = clamp(ray.y, -1.0, 1.0);
  let lift = clamp(height, 0.0, 1.0);

  var color = mix(SKY_HORIZON, SKY_ZENITH, pow(lift, 0.35));
  color = color + vec3f(0.17, 0.14, 0.08) * exp(-lift * 13.0);

  let sunAngle = max(dot(ray, sun), 0.0);
  color = color + vec3f(2.6, 2.45, 2.1) * pow(sunAngle, 4000.0);
  color = color + vec3f(0.55, 0.45, 0.30) * pow(sunAngle, 220.0);
  color = color + vec3f(0.20, 0.16, 0.10) * pow(sunAngle, 22.0);

  return vec4f(color, 1.0);
}
`;

/* ------------------------------------------------------------------------------------------------ */
/* 山脊（垂直幕布）                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

const RIDGE_VERTEX_GLSL = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec3 color;
layout(location = 3) in vec2 extra;

${COMMON_GLSL}

out vec3 vColor;
out vec3 vNormal;
out vec3 vWorld;
out float vDistance;
// 这一层山脊自带的雾倍率（远山更重）。它是**顶点属性**，片元里读不到，必须插值过来。
out float vHaze;

void main() {
  vColor = color;
  vNormal = normal;
  vWorld = position;
  vDistance = length(position - u.cameraPosition.xyz);
  vHaze = extra.x;
  gl_Position = u.viewProjection * vec4(position, 1.0);
}
`;

const RIDGE_FRAGMENT_GLSL = `
in vec3 vColor;
in vec3 vNormal;
in vec3 vWorld;
in float vDistance;
in float vHaze;

layout(location = 0) out vec4 fragColor;

${COMMON_FRAGMENT_GLSL}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 sun = normalize(u.sunDirection.xyz);
  // 环境项给到 0.62：太阳很低（约 8°）、又是逆光，纯漫反射会让整座山黑成一块剪影；
  // 剩下的 0.5 交给法线（幕布的法线由脊线斜率推出，迎光与背光的两侧亮度差很明显）。
  float diffuse = 0.62 + 0.5 * max(dot(normal, sun), 0.0);
  vec3 color = vColor * diffuse;
  // 太阳一侧的暖色描边：让山脊线在天空里更清楚。
  vec3 sunFlat = normalize(vec3(sun.x, 0.0, sun.z));
  float side = max(dot(normalize(vec3(normal.x, 0.0, normal.z)), sunFlat), 0.0);
  color += vec3(0.26, 0.17, 0.06) * pow(side, 2.0);
  // 山脚低、又被前面的坡挡住，所以雾比山顶略重：低处把倍率放大、高处收回去。
  float heightHaze = clamp(1.25 - vWorld.y * 0.01, 0.7, 1.4);
  // 注意传进去的是**倍率**，fogDensity() 才负责乘上真实浓度（上一版直接把倍率当浓度）。
  color = fogMix(color, vDistance, fogDensity(vHaze * heightHaze));
  if (u.timeAndFog.w > 0.5) {
    color = mix(color, vec3(0.95, 0.95, 1.0), 0.6 * gridLines(vWorld.xz * 0.25));
  }
  fragColor = vec4(color, 1.0);
}
`;

const RIDGE_WGSL = `
struct Uniforms {
  viewProjection: mat4x4f,
  inverseViewProjection: mat4x4f,
  cameraPosition: vec4f,
  sunDirection: vec4f,
  timeAndFog: vec4f,
  water: vec4f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

${WGSL_COMMON}

struct RidgeVertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) color: vec3f,
  @location(3) extra: vec2f,
}

struct RidgeVertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec3f,
  @location(1) normal: vec3f,
  @location(2) world: vec3f,
  @location(3) distance: f32,
  @location(4) haze: f32,
}

@vertex fn vsMain(v: RidgeVertexInput) -> RidgeVertexOutput {
  var out: RidgeVertexOutput;
  out.color = v.color;
  out.normal = v.normal;
  out.world = v.position;
  out.distance = length(v.position - u.cameraPosition.xyz);
  out.haze = v.extra.x;
  out.position = u.viewProjection * vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain(in: RidgeVertexOutput) -> @location(0) vec4f {
  let normal = normalize(in.normal);
  let sun = normalize(u.sunDirection.xyz);
  let diffuse = 0.62 + 0.5 * max(dot(normal, sun), 0.0);
  var color = in.color * diffuse;
  let sunFlat = normalize(vec3f(sun.x, 0.0, sun.z));
  let side = max(dot(normalize(vec3f(normal.x, 0.0, normal.z)), sunFlat), 0.0);
  color = color + vec3f(0.26, 0.17, 0.06) * pow(side, 2.0);
  let heightHaze = clamp(1.25 - in.world.y * 0.01, 0.7, 1.4);
  color = fogMix(color, in.distance, fogDensity(in.haze * heightHaze));
  if (u.timeAndFog.w > 0.5) {
    color = mix(color, vec3f(0.95, 0.95, 1.0), 0.6 * gridLines(in.world.xz * 0.25));
  }
  return vec4f(color, 1.0);
}
`;

/* ------------------------------------------------------------------------------------------------ */
/* 地形（河岸 + 山坡），河道处 discard                                                                   */
/* ------------------------------------------------------------------------------------------------ */




/** 高度场网格的顶点着色器：解析法线（fbm3 的有限差分），比 dFdx 在陡坡上稳。 */
const TERRAIN_VERTEX_GLSL = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec3 color;
layout(location = 3) in vec2 extra;

${COMMON_GLSL}

out vec3 vColor;
out vec3 vNormal;
out vec3 vWorld;
out float vDistance;

void main() {
  vWorld = position;
  vDistance = length(position - u.cameraPosition.xyz);
  // 法线**直接用网格顶点上算好的那一份**（buildTerrainMesh 里按 0.6 的步长求高度场梯度）。
  // 不要在着色器里再量一次：这里的 groundHeight 与 CPU 的列表公式在噪声细节上不完全一致，
  // 小步长会把这层微小的差值放大成「近乎垂直的坡面」，地形漫反射因此被压成黑色。
  vNormal = normal;
  vColor = color;
  gl_Position = u.viewProjection * vec4(position, 1.0);
}
`;

const TERRAIN_FRAGMENT_GLSL = `
in vec3 vWorld;
in float vDistance;

layout(location = 0) out vec4 fragColor;
${COMMON_FRAGMENT_GLSL}

void main() {
  vec2 p = vWorld.xz;
  // 河床单独由河床管线画（沙石色 + 颗粒噪声），这里把河道整块挖掉：
  // 两个网格的边界都是同一条 channelWeight 等值线，所以拼缝严丝合缝。
  if (channelWeight(p) > 0.02) {
    discard;
  }
  // 法线在片元里按高度场的梯度重算，而不是直接用顶点属性 vNormal。
  // 两者现在是同一份高度场（CPU 与着色器的 terrainHeight 逐字对应），差别只在粒度：
  // 顶点法线的步长也是 0.6，但地形网格的格子在 3~13 个单位宽之间，
  // 片元里按世界坐标现算可以得到更细的坡面朝向。步长 0.6（比河道半宽略大）：
  // 河岸本身很平缓，更小的步长会被噪声的高频细节带偏，量出近乎垂直的坡面。
  float epsilon = 0.6;
  vec3 normal = normalize(vec3(
    -((terrainHeight(p + vec2(epsilon, 0.0)) - vWorld.y) / epsilon),
    1.0,
    -((terrainHeight(p + vec2(0.0, epsilon)) - vWorld.y) / epsilon)));
  vec3 sun = normalize(u.sunDirection.xyz);
  // 环境项给到 0.55：太阳仰角只有约 8°，平坦的河岸与太阳的夹角本来就小，
  // 环境项太小整片地形会暗成深绿（实测 24,43,20）；再留 0.55 给太阳方向，
  // 朝太阳抬起的坡面（远处的对岸）就会明显更亮，地形读起来才有「坡」。
  float diffuse = 0.55 + 0.55 * max(dot(normal, sun), 0.0);
  // 地形颜色**在片元里按世界坐标算**，不读网格颜色属性。
  // 地形的配色本来就是「噪声 → 草绿 / 林绿 / 干土」的纯函数，在片元里算一份比顶点插值细得多
  //（地形网格的格子有 3~13 个单位宽，靠顶点色会糊成一块块）。
  float slope = clamp((fbm3(p * 0.34) + fbm3(p * 0.09)) * 0.5, 0.0, 1.0);
  float dry = smoothstep(1.9, 3.3, vWorld.y);
  vec3 color = mix(vec3(0.3, 0.5, 0.19), vec3(0.13, 0.29, 0.13), slope);
  // 高处偏干偏灰（土坡与岩石），低处是河岸的草绿：一眼能看出地势的高低。
  color = mix(color, vec3(0.44, 0.42, 0.34), dry * 0.75);
  color *= diffuse;
  color += vec3(0.22, 0.15, 0.05) * pow(max(dot(normal, sun), 0.0), 4.0);
  // 高度越低雾越厚（山脚在远处更容易被大气糊掉），但近岸本身必须清晰：
  // 倍率只在 0.7~1.3 之间摆动，再乘 fogDensity() 里的真实浓度。
  float heightHaze = clamp(1.3 - vWorld.y * 0.05, 0.7, 1.3);
  color = fogMix(color, vDistance, fogDensity(${FOG_TERRAIN_SCALE_GLSL} * heightHaze));
  if (u.timeAndFog.w > 0.5) {
    color = mix(color, vec3(0.95, 0.95, 1.0), 0.7 * gridLines(p * 0.5));
  }
  fragColor = vec4(color, 1.0);
}
`;

const TERRAIN_WGSL = `
struct Uniforms {
  viewProjection: mat4x4f,
  inverseViewProjection: mat4x4f,
  cameraPosition: vec4f,
  sunDirection: vec4f,
  timeAndFog: vec4f,
  water: vec4f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

${WGSL_COMMON}

fn meanderScale(depth: f32) -> f32 {
  let d = max(depth, 4.0);
  return ${RIVER_MEANDER_CAP.toFixed(1)} * (1.0 - exp(-d / ${RIVER_MEANDER_CAP.toFixed(1)}));
}

fn channelHalfWidth(depth: f32) -> f32 {
  return 0.105 * meanderScale(depth);
}

fn meanderOffset(z: f32, depth: f32) -> f32 {
  return (sin(z * 0.021) * 0.34 + sin(z * 0.0073) * 0.55) * meanderScale(depth);
}

fn channelWeight(p: vec2f) -> f32 {
  let depth = max(u.cameraPosition.z - p.y, 4.0);
  let halfWidth = channelHalfWidth(depth);
  let meander = meanderOffset(p.y, depth);
  let lateral = abs(p.x - meander) / halfWidth;
  let cut = 1.0 - smoothstep(0.62, 1.0, lateral);
  // 与 GLSL 那边逐字一致：比走廊网格更远的地方不再挖河道，免得留下一个洞。
  return cut * (1.0 - smoothstep(320.0, 360.0, depth));
}

// 河岸高度（不含河道）：与 CPU 的 terrainHeightCpu 逐字对应（理由见 GLSL 那边）。
fn terrainHeight(p: vec2f) -> f32 {
  let depth = max(u.cameraPosition.z - p.y, 4.0);
  return (depth / 430.0) * ${TERRAIN_RISE.toFixed(2)} + ${TERRAIN_BASE.toFixed(2)}
    + fbm3(p * ${TERRAIN_NOISE_FREQUENCY.toFixed(3)}) * ${TERRAIN_NOISE_AMPLITUDE.toFixed(2)};
}

fn groundHeight(p: vec2f) -> f32 {
  return terrainHeight(p);
}

/**
 * 地形法线：高度场的横向梯度（步长 0.6，比河道半宽略大，量的是坡地的整体朝向）。
 * 河道那一段的形状由走廊网格负责，地形顶点不参与。
 */
fn terrainNormal(p: vec2f, height: f32) -> vec3f {
  let e = 0.6;
  let gx = (terrainHeight(p + vec2f(e, 0.0)) - height) / e;
  let gz = (terrainHeight(p + vec2f(0.0, e)) - height) / e;
  return normalize(vec3f(-gx, 1.0, -gz));
}

struct TerrainVertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) color: vec3f,
  @location(3) extra: vec2f,
}

struct TerrainVertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec3f,
  @location(1) normal: vec3f,
  @location(2) world: vec3f,
  @location(3) distance: f32,
}

@vertex fn vsMain(v: TerrainVertexInput) -> TerrainVertexOutput {
  var out: TerrainVertexOutput;
  out.world = v.position;
  out.distance = length(v.position - u.cameraPosition.xyz);
  // 法线用网格顶点上算好的那一份（理由见 GLSL 那边）。
  out.normal = v.normal;
  out.color = v.color;
  out.position = u.viewProjection * vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain(in: TerrainVertexOutput) -> @location(0) vec4f {
  let p = in.world.xz;
  if (channelWeight(p) > 0.02) {
    discard;
  }
  // 法线在片元里按高度场梯度重算（与 GLSL 那边同一份公式、同一个步长）。
  let epsilon = 0.6;
  let normal = normalize(vec3f(
    -((terrainHeight(p + vec2f(epsilon, 0.0)) - in.world.y) / epsilon),
    1.0,
    -((terrainHeight(p + vec2f(0.0, epsilon)) - in.world.y) / epsilon)));
  let sun = normalize(u.sunDirection.xyz);
  let diffuse = 0.55 + 0.55 * max(dot(normal, sun), 0.0);
  // 地形配色在片元里按世界坐标算（与 GLSL 那边同一份公式）。
  let slope = clamp((fbm3(p * 0.34) + fbm3(p * 0.09)) * 0.5, 0.0, 1.0);
  let dry = smoothstep(1.9, 3.3, in.world.y);
  var color = mix(vec3f(0.3, 0.5, 0.19), vec3f(0.13, 0.29, 0.13), slope);
  color = mix(color, vec3f(0.44, 0.42, 0.34), dry * 0.75);
  color = color * diffuse;
  color = color + vec3f(0.22, 0.15, 0.05) * pow(max(dot(normal, sun), 0.0), 4.0);
  let heightHaze = clamp(1.3 - in.world.y * 0.05, 0.7, 1.3);
  color = fogMix(color, in.distance, fogDensity(${FOG_TERRAIN_SCALE_GLSL} * heightHaze));
  if (u.timeAndFog.w > 0.5) {
    color = mix(color, vec3f(0.95, 0.95, 1.0), 0.7 * gridLines(p * 0.5));
  }
  return vec4f(color, 1.0);
}
`;

/* ------------------------------------------------------------------------------------------------ */
/* 河床（沙石 / 卵石）                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

const RIVERBED_VERTEX_GLSL = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec3 color;
layout(location = 3) in vec2 extra;

${UNIFORM_BLOCK_GLSL}

out vec3 vNormal;
out vec3 vWorld;
out float vDistance;
out float vWet;

void main() {
  vNormal = normal;
  vWorld = position;
  vDistance = length(position - u.cameraPosition.xyz);
  // extra.x 是走廊网格带过来的**世界高度**：低于水面 = 泡在水里。
  vWet = clamp((0.06 - position.y) / 0.5, 0.0, 1.0);
  gl_Position = u.viewProjection * vec4(position, 1.0);
}
`;

const RIVERBED_FRAGMENT_GLSL = `
in vec3 vNormal;
in vec3 vWorld;
in float vDistance;
in float vWet;

layout(location = 0) out vec4 fragColor;
${COMMON_FRAGMENT_GLSL}

void main() {
  vec2 p = vWorld.xz;
  // 颗粒：大颗粒是「卵石」（一团团亮斑），小颗粒是砂砾。
  float pebbles = smoothstep(0.52, 1.0, fbm3(p * 0.95));
  // 砂砾噪声先过一遍 smoothstep 再当明暗用：fbm3 的取值本来就集中在 0.44 附近
  //（三个八度叠出来的分布很窄，标准差只有 0.09），直接相乘只能得到 ±9% 的明暗差，
  // 透过水面看过去几乎是纯色（实测亮度标准差 3.7~4.5）。映射到 0.33~0.58 之后
  // 明暗差到 2.5 倍，砂砾/卵石的质感才真的透得出来。
  float grit = smoothstep(0.33, 0.58, fbm3(p * 3.6));
  // 沙石底：沙滩色 + 卵石偏青灰 + 砂砾的明暗。
  // 刻意**偏中性、不要过暖**：河床要透过一层青蓝色的水被看到，
  // 旧版的 0.82/0.74/0.55 太黄，混出来的水面是白的（实测 238,239,227，river-blue 判据不过）。
  vec3 sand = vec3(0.58, 0.6, 0.5);
  vec3 stone = vec3(0.4, 0.46, 0.44);
  vec3 color = mix(sand, stone, pebbles * 0.85);
  // 明暗对比要够：这一层的**亮度**起伏就是「透过水看得见河床颗粒」的证据
  //（岸上的沙子几乎是纯色，颗粒感全靠这里）。0.5 + 0.95 × grit 让明暗差到 2.5 倍。
  color *= 0.5 + 0.95 * grit;
  // 水面波纹投在河床上的晃动光斑：让「透过水看到的河床」是活的。
  float ripple = sin(p.x * 2.3 + u.timeAndFog.x * 1.7) * sin(p.y * 1.9 - u.timeAndFog.x * 1.3);
  color += vec3(0.14, 0.16, 0.12) * ripple * 0.5;
  // 水下的砂石压暗一点（透过水面看河床不该亮得发光）。
  color *= 1.0 - 0.24 * vWet;
  vec3 normal = normalize(vNormal);
  vec3 sun = normalize(u.sunDirection.xyz);
  color *= 0.5 + 0.7 * max(dot(normal, sun), 0.0);
  color = fogMix(color, vDistance, fogDensity(${FOG_BED_SCALE_GLSL}));
  fragColor = vec4(color, 1.0);
}
`;

const RIVERBED_WGSL = `
struct Uniforms {
  viewProjection: mat4x4f,
  inverseViewProjection: mat4x4f,
  cameraPosition: vec4f,
  sunDirection: vec4f,
  timeAndFog: vec4f,
  water: vec4f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

${WGSL_COMMON}

struct RiverbedVertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) color: vec3f,
  @location(3) extra: vec2f,
}

struct RiverbedVertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) world: vec3f,
  @location(2) distance: f32,
  @location(3) wet: f32,
}

@vertex fn vsMain(v: RiverbedVertexInput) -> RiverbedVertexOutput {
  var out: RiverbedVertexOutput;
  out.normal = v.normal;
  out.world = v.position;
  out.distance = length(v.position - u.cameraPosition.xyz);
  // extra.x 是走廊网格带过来的**世界高度**：低于水面 = 泡在水里。
  out.wet = clamp((0.06 - v.position.y) / 0.5, 0.0, 1.0);
  out.position = u.viewProjection * vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain(in: RiverbedVertexOutput) -> @location(0) vec4f {
  let p = in.world.xz;
  let pebbles = smoothstep(0.52, 1.0, fbm3(p * 0.95));
  // 与 GLSL 那边同一份公式（先做对比度映射，理由见那边）。
  let grit = smoothstep(0.33, 0.58, fbm3(p * 3.6));
  let sand = vec3f(0.58, 0.6, 0.5);
  let stone = vec3f(0.4, 0.46, 0.44);
  var color = mix(sand, stone, pebbles * 0.85);
  color = color * (0.5 + 0.95 * grit);
  let ripple = sin(p.x * 2.3 + u.timeAndFog.x * 1.7) * sin(p.y * 1.9 - u.timeAndFog.x * 1.3);
  color = color + vec3f(0.14, 0.16, 0.12) * ripple * 0.5;
  // 水下的砂石压暗一点（透过水面看河床不会亮得发光）。
  color = color * (1.0 - 0.24 * in.wet);
  let normal = normalize(in.normal);
  let sun = normalize(u.sunDirection.xyz);
  color = color * (0.5 + 0.7 * max(dot(normal, sun), 0.0));
  color = fogMix(color, in.distance, fogDensity(${FOG_BED_SCALE_GLSL}));
  return vec4f(color, 1.0);
}
`;

/* ------------------------------------------------------------------------------------------------ */
/* 树林（实例化：树干与树冠各一次 draw call）                                                            */
/* ------------------------------------------------------------------------------------------------ */

/**
 * 树的顶点属性。
 *
 * 网格属性按 `bindMesh()` 的槽位声明：位置(0) / 法线(1)（**不含**颜色(2) 与备用(3)，
 * 因为实例数据已经占了 `location 3`，同一个 `@location` 在一条管线的全部 buffers 里只能出现一次）。
 * 实例属性是 `location 3 = vec4(世界坐标 xyz, 缩放)` 与 `location 8 = vec2(旋转角, 备用)`。
 *
 * **没有用「每实例一个 mat4」，也没有用每实例颜色**：mat4 要吃掉 4 个连续的 attribute location，
 * 而每棵树的颜色本来就可以由**世界坐标哈希**在片元里算出来 —— 同样的确定性、每棵树深浅不同，
 * 却只需要 6 个 float 的实例数据、一条容易看懂的实例缓冲路径。这是这一版刻意做的减法。
 */
const TREE_VERTEX_GLSL = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 3) in vec4 instanceOffset;
layout(location = 8) in vec2 instanceInfo;

${UNIFORM_BLOCK_GLSL}

out vec3 vNormal;
out vec3 vWorld;
out float vDistance;
out float vLocalY;

void main() {
  // 实例变换 = 绕 Y 轴旋转 + 等比缩放 + 平移：正交旋转不会改变法线的长度，直接转一下即可。
  float spin = instanceInfo.x;
  float scale = instanceOffset.w;
  float cosine = cos(spin);
  float sine = sin(spin);
  vec3 local = vec3(
    (position.x * cosine + position.z * sine) * scale,
    position.y * scale,
    (-position.x * sine + position.z * cosine) * scale);
  vec3 world = local + instanceOffset.xyz;
  vWorld = world;
  vNormal = vec3(
    normal.x * cosine + normal.z * sine,
    normal.y,
    -normal.x * sine + normal.z * cosine);
  vDistance = length(world - u.cameraPosition.xyz);
  vLocalY = position.y;
  gl_Position = u.viewProjection * vec4(world, 1.0);
}
`;

const TREE_FRAGMENT_GLSL = `
in vec3 vNormal;
in vec3 vWorld;
in float vDistance;
in float vLocalY;

layout(location = 0) out vec4 fragColor;
${COMMON_FRAGMENT_GLSL}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 sun = normalize(u.sunDirection.xyz);
  float diffuse = 0.38 + 0.62 * max(dot(normal, sun), 0.0);
  // 每棵树的深浅由世界坐标的哈希决定：树冠 0.55~0.85 的绿，树干是同一份深浅压暗后的棕。
  float variation = hash21(floor(vWorld.xz * 0.7));
  float trunk = clamp(1.0 - vLocalY * 2.6, 0.0, 1.0);
  vec3 canopy = vec3(0.2, 0.42, 0.17) * (1.1 + variation * 0.75);
  vec3 bark = vec3(0.4, 0.29, 0.2) * (1.0 + variation * 0.5);
  vec3 color = mix(canopy, bark, trunk);
  // 树冠上点几道斜纹，远看才有「枝叶」的层次。
  float branch = sin((vWorld.x + vWorld.z) * 2.6 + vLocalY * 7.0);
  color *= mix(0.86 + 0.22 * smoothstep(-0.15, 0.75, branch), 1.0, trunk);

  color *= diffuse;
  color = fogMix(color, vDistance, fogDensity(${FOG_TREE_SCALE_GLSL}));
  if (u.timeAndFog.w > 0.5) {
    color = mix(color, vec3(0.95, 0.95, 1.0), 0.7 * gridLines(vWorld.xz * 0.4));
  }
  fragColor = vec4(color, 1.0);
}
`;

const TREE_WGSL = `
struct Uniforms {
  viewProjection: mat4x4f,
  inverseViewProjection: mat4x4f,
  cameraPosition: vec4f,
  sunDirection: vec4f,
  timeAndFog: vec4f,
  water: vec4f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

${WGSL_COMMON}

/**
 * WGSL 的树顶点输入。
 *
 * 与 GLSL 那边逐 location 对齐：网格 position(0) / normal(1) / **color(2)**，
 * 实例 instanceOffset(3) = vec4(xyz, 缩放)、instanceColor(7)、instanceInfo(8) = vec2(旋转角, 备用)。
 * GLSL 用 layout(location = 3) in vec4，WGSL 里就是一个 vec4f —— 没有 mat4 那条多 location 的路。
 */
struct TreeVertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(3) instanceOffset: vec4f,
  @location(8) instanceInfo: vec2f,
}

struct TreeVertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) world: vec3f,
  @location(2) distance: f32,
  @location(3) localY: f32,
}

@vertex fn vsMain(v: TreeVertexInput) -> TreeVertexOutput {
  var out: TreeVertexOutput;
  let spin = v.instanceInfo.x;
  let scale = v.instanceOffset.w;
  let cosine = cos(spin);
  let sine = sin(spin);
  let local = vec3f(
    (v.position.x * cosine + v.position.z * sine) * scale,
    v.position.y * scale,
    (-v.position.x * sine + v.position.z * cosine) * scale);
  let world = local + v.instanceOffset.xyz;
  out.world = world;
  out.normal = vec3f(
    v.normal.x * cosine + v.normal.z * sine,
    v.normal.y,
    -v.normal.x * sine + v.normal.z * cosine);
  out.distance = length(world - u.cameraPosition.xyz);
  out.localY = v.position.y;
  // 注意要补一个 w = 1.0 再乘矩阵：WGSL 里没有 mat4x4 × vec3 的重载。
  out.position = u.viewProjection * vec4f(world, 1.0);
  return out;
}

@fragment fn fsMain(in: TreeVertexOutput) -> @location(0) vec4f {
  let normal = normalize(in.normal);
  let sun = normalize(u.sunDirection.xyz);
  let diffuse = 0.38 + 0.62 * max(dot(normal, sun), 0.0);
  // 每棵树的深浅由世界坐标的哈希决定：树冠是深浅不一的绿，树干是同一份深浅压暗后的棕。
  let variation = hash21(floor(in.world.xz * 0.7));
  let trunk = clamp(1.0 - in.localY * 2.6, 0.0, 1.0);
  let canopy = vec3f(0.2, 0.42, 0.17) * (1.1 + variation * 0.75);
  let bark = vec3f(0.4, 0.29, 0.2) * (1.0 + variation * 0.5);
  var color = mix(canopy, bark, trunk);
  // 树冠上点几道斜纹，远看才有「枝叶」的层次。
  let branch = sin((in.world.x + in.world.z) * 2.6 + in.localY * 7.0);
  color = color * mix(0.86 + 0.22 * smoothstep(-0.15, 0.75, branch), 1.0, trunk);

  color = color * diffuse;
  color = fogMix(color, in.distance, fogDensity(${FOG_TREE_SCALE_GLSL}));
  if (u.timeAndFog.w > 0.5) {
    color = mix(color, vec3f(0.95, 0.95, 1.0), 0.7 * gridLines(in.world.xz * 0.4));
  }
  return vec4f(color, 1.0);
}
`;

/* ------------------------------------------------------------------------------------------------ */
/* 水面（透明 + fresnel + 波纹高光）                                                                     */
/* ------------------------------------------------------------------------------------------------ */

const WATER_VERTEX_GLSL = `
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec3 color;
layout(location = 3) in vec2 extra;

${UNIFORM_BLOCK_GLSL}

out vec2 vWaterUv;
out vec3 vWorld;
out float vDistance;
/** 这一列下方的河床高度（< 0 = 在水下）。用来判断「这里有多深」，浅到露底就退化成湿沙。 */
out float vBedHeight;

void main() {
  vWorld = position;
  // 河道是沿 z 走的，所以用 (x, z) 当波纹的二维参数就够（无需 uv 属性）。
  vWaterUv = position.xz;
  vDistance = length(position - u.cameraPosition.xyz);
  vBedHeight = extra.x;
  gl_Position = u.viewProjection * vec4(position, 1.0);
}
`;

const WATER_FRAGMENT_GLSL = `
in vec2 vWaterUv;
in vec3 vWorld;
in float vDistance;
in float vBedHeight;

layout(location = 0) out vec4 fragColor;
${COMMON_FRAGMENT_GLSL}

void main() {
  // 波纹：三层不同频率/方向的正弦叠加，只用来扰动法线，不改变几何。
  // 振幅 0.16 是量出来的：0.09 时水面几乎是一面平镜，波纹高光只有一两个像素在动，
  // 「河面区有多种相近色调」与「时间在动」两条判据都量不到东西。
  float wave = 0.0;
  wave += sin(vWaterUv.x * 1.5 + u.timeAndFog.x * 1.7) * 0.5;
  wave += sin(vWaterUv.y * 1.2 - u.timeAndFog.x * 1.1) * 0.4;
  wave += sin((vWaterUv.x + vWaterUv.y) * 2.6 + u.timeAndFog.x * 2.2) * 0.25;
  vec3 normal = normalize(vec3(wave * 0.16, 1.0, wave * 0.13));

  vec3 view = u.cameraPosition.xyz - vWorld;
  vec3 viewDir = normalize(view);
  vec3 sun = normalize(u.sunDirection.xyz);

  // fresnel：垂直看下去 → 小（看得见河床）；掠射角 → 大（反射天空）。
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 5.0);
  fresnel = 0.08 + 0.72 * fresnel;

  // 反射色：把视线按法线镜像之后去采天空，得到「水面上的天空」。
  vec3 reflected = normalize(reflect(-viewDir, normal));
  float height = clamp(reflected.y, 0.0, 1.0);
  // 与天空着色器用同一份渐变（同一个指数 0.35），水面上的反射才和真正的天空接得上。
  vec3 sky = mix(SKY_HORIZON, SKY_ZENITH, pow(height, 0.35));
  float sunAngle = max(dot(reflected, sun), 0.0);
  // 波纹高光 = 一宽一窄两个波瓣：窄的那层是一颗颗闪点（随时间流动），
  // 宽的那层是整片水的「天光」，两者一起让河面有一层层相近的色调。
  sky += vec3(1.0, 0.9, 0.7) * pow(sunAngle, 900.0) * 1.1;
  sky += vec3(0.5, 0.5, 0.42) * pow(sunAngle, 18.0);

  // 水面自身的水色（青蓝），保证「河」即使全反射也还是条河。
  vec3 deep = vec3(0.07, 0.3, 0.42);
  // 水浅的地方（河床近）水色会被河床的暖色透上来，所以这里按 fresnel 补一点冷调的青绿。
  vec3 shallowTint = vec3(0.06, 0.14, 0.11) * (1.0 - fresnel);

  // 水面自身的颜色 = 水色 → 天空反射（fresnel 越高越像镜子）。
  vec3 color = mix(deep, sky, clamp(fresnel * u.water.y, 0.0, 0.8)) + shallowTint;
  // 水深 → 水色更沉（Beer-Lambert 的廉价近似）：河床越深，透上来的暖色越少、青蓝越重。
  // 河道横截面上河床高度是从「正中 -0.9」连续升到「岸边 +1」的，所以这一项天然给出
  // **一条横跨河面的色调梯度** —— 垂直看下去是「中间深、两侧浅」的一条河，而不是一块纯色。
  float deepWater = clamp(-vBedHeight * 1.1, 0.0, 1.0);
  color = mix(color, deep, deepWater * 0.3);
  // 掠射角的锐利镜面高光：水面的「闪光」（波纹把高光切成一条条亮线，就是「波纹高光」）。
  float glint = pow(max(dot(reflected, sun), 0.0), 120.0);
  color += vec3(1.0, 0.95, 0.85) * glint * 1.7;
  // 波纹本身也让水色轻微起伏（相当于看到水面下的明暗），河面才有「多种相近色调」。
  color *= 1.0 + wave * 0.07;

  // 透明度就是「清澈」：垂直看下去 alpha 低（河床看得清），掠射角 alpha 高（反射天空）。
  // 上下限都留着，所以两个极端下河床与天空反射都还在，不会变成纯镜面或纯玻璃。
  // 这里是唯一一处 depthWriteEnabled:false + blend 的管线：alpha 直接决定河床透出多少。
  float alpha = clamp(u.water.x * (0.3 + 0.7 * fresnel), 0.05, 0.88);
  // 河床已经接近水面的那一圈**加一层湿沙色**再抬高 alpha：水面与岸坡相交的地方
  // 不会出现一条突兀的亮边，看起来就像水刚淹上沙滩。
  float shallow = smoothstep(0.12, -0.06, vBedHeight);
  color = mix(color, vec3(0.3, 0.36, 0.33), shallow * 0.45);
  alpha = clamp(alpha + shallow * 0.35, 0.05, 0.95);
  // 水面的雾最淡：远处的水也要看得出「这是一条河」，不能被雾彻底吃掉。
  color = fogMix(color, vDistance, fogDensity(${FOG_WATER_SCALE_GLSL}));
  fragColor = vec4(color, alpha);
}
`;

const WATER_WGSL = `
struct Uniforms {
  viewProjection: mat4x4f,
  inverseViewProjection: mat4x4f,
  cameraPosition: vec4f,
  sunDirection: vec4f,
  timeAndFog: vec4f,
  water: vec4f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

${WGSL_COMMON}

struct WaterVertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) color: vec3f,
  @location(3) extra: vec2f,
}

struct WaterVertexOutput {
  @builtin(position) position: vec4f,
  @location(0) waterUv: vec2f,
  @location(1) world: vec3f,
  @location(2) distance: f32,
  @location(3) bedHeight: f32,
}

@vertex fn vsMain(v: WaterVertexInput) -> WaterVertexOutput {
  var out: WaterVertexOutput;
  out.world = v.position;
  out.waterUv = v.position.xz;
  out.distance = length(v.position - u.cameraPosition.xyz);
  out.bedHeight = v.extra.x;
  out.position = u.viewProjection * vec4f(v.position, 1.0);
  return out;
}

@fragment fn fsMain(in: WaterVertexOutput) -> @location(0) vec4f {
  var wave = 0.0;
  wave = wave + sin(in.waterUv.x * 1.5 + u.timeAndFog.x * 1.7) * 0.5;
  wave = wave + sin(in.waterUv.y * 1.2 - u.timeAndFog.x * 1.1) * 0.4;
  wave = wave + sin((in.waterUv.x + in.waterUv.y) * 2.6 + u.timeAndFog.x * 2.2) * 0.25;
  let normal = normalize(vec3f(wave * 0.16, 1.0, wave * 0.13));

  let view = u.cameraPosition.xyz - in.world;
  let viewDir = normalize(view);
  let sun = normalize(u.sunDirection.xyz);

  var fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 5.0);
  fresnel = 0.08 + 0.72 * fresnel;

  let reflected = normalize(reflect(-viewDir, normal));
  let height = clamp(reflected.y, 0.0, 1.0);
  var sky = mix(SKY_HORIZON, SKY_ZENITH, pow(height, 0.35));
  let sunAngle = max(dot(reflected, sun), 0.0);
  sky = sky + vec3f(1.0, 0.9, 0.7) * pow(sunAngle, 900.0) * 1.1;
  sky = sky + vec3f(0.5, 0.5, 0.42) * pow(sunAngle, 18.0);

  let deep = vec3f(0.07, 0.3, 0.42);
  let shallowTint = vec3f(0.06, 0.14, 0.11) * (1.0 - fresnel);

  var color = mix(deep, sky, clamp(fresnel * u.water.y, 0.0, 0.8)) + shallowTint;
  // 水深 → 水色更沉（与 GLSL 那边同一份公式）。
  let deepWater = clamp(-in.bedHeight * 1.1, 0.0, 1.0);
  color = mix(color, deep, deepWater * 0.3);
  let glint = pow(max(dot(reflected, sun), 0.0), 120.0);
  color = color + vec3f(1.0, 0.95, 0.85) * glint * 1.7;
  color = color * (1.0 + wave * 0.07);

  var alpha = clamp(u.water.x * (0.3 + 0.7 * fresnel), 0.05, 0.88);
  let shallow = smoothstep(0.12, -0.06, in.bedHeight);
  color = mix(color, vec3f(0.3, 0.36, 0.33), shallow * 0.45);
  alpha = clamp(alpha + shallow * 0.35, 0.05, 0.95);
  color = fogMix(color, in.distance, fogDensity(${FOG_WATER_SCALE_GLSL}));
  return vec4f(color, alpha);
}
`;

/* ------------------------------------------------------------------------------------------------ */
/* 几何体构建                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

/** 顶点属性：位置 / 法线 / 颜色 / 备用两通道（山脊放 `[相位, 高度比]`，其它当 0）。 */
type VertexWriter = (
  index: number,
  u: number,
  v: number,
) => {
  readonly position: readonly [number, number, number];
  readonly normal: readonly [number, number, number];
  readonly color: readonly [number, number, number];
  readonly extra?: readonly [number, number];
};

/** 网格缓冲：索引统一用 `uint32`（顶点数会超过 65535）。 */
interface MeshBuffers {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly colors: Float32Array;
  readonly extras: Float32Array;
  readonly indices: Uint32Array;
  readonly vertexCount: number;
  readonly indexCount: number;
  readonly triangleCount: number;
}

/** 顶点属性步长（字节）：position 12 + normal 12 + color 12 + extra 8 = 44。 */
const MESH_STRIDE = 44;

/**
 * 所有网格共用的**唯一一段顶点缓冲布局**（交错式，44 字节一条记录）。
 *
 * 这里刻意让「管线 `vertex.buffers` 的个数」保持为 1，而不是「位置/法线/颜色/备用各一段」：
 * 每个属性一段时，管线的 `arrayStride` 必须写成该属性**自己**的字节数（12 或 8），
 * 一旦照抄 44 就会让第 i 个顶点去读 `44 × i` 处的字节 —— 而缓冲区里只有 `12 × 顶点数` 字节，
 * 于是超过约 27% 的顶点全部越界。WebGL2 的越界读取被 robust access 静默填成 `(0,0,0,1)`，
 * 位置直接塌到原点，半个网格变成横跨全屏的巨型退化三角形（这正是「地形铺满 79% 屏幕、
 * 山脊像一块幕布、`TERRAIN_RISE` 怎么调都没反应」的真正原因）；WebGPU 那边则根本不给提示。
 * 交错成一段之后 `arrayStride` 与缓冲区的真实间距一致，两个后端读到的都是同一份数据。
 */
const MESH_VERTEX_LAYOUT = {
  arrayStride: MESH_STRIDE,
  stepMode: 'vertex',
  attributes: [
    { shaderLocation: 0, offset: 0, format: 'float32x3' },
    { shaderLocation: 1, offset: 12, format: 'float32x3' },
    { shaderLocation: 2, offset: 24, format: 'float32x3' },
    { shaderLocation: 3, offset: 36, format: 'float32x2' },
  ],
} as const;

/**
 * 树林管线里**网格那一段**的布局：只声明位置(0)与法线(1)，**不能带上备用通道(3)**。
 *
 * 树是唯一一条用实例缓冲的管线，而实例数据自己占了 `location 3`（见下面的 instance 槽位）。
 * WebGPU 规定「同一个 `@location` 在整条管线的全部 `buffers` 里只能出现一次」
 *（实测报错：`Attribute shader location (3) is used more than once. While validating buffers[1].`），
 * 于是整条树管线创建失败、画面上什么都没有。树干 / 树冠的片元也不需要备用通道
 *（它按世界坐标哈希算颜色），所以这里就只留真正被读到的两个属性。
 */
const TREE_MESH_VERTEX_LAYOUT = {
  arrayStride: MESH_STRIDE,
  stepMode: 'vertex',
  attributes: [
    { shaderLocation: 0, offset: 0, format: 'float32x3' },
    { shaderLocation: 1, offset: 12, format: 'float32x3' },
  ],
} as const;

/** 按 `(cols+1) × (rows+1)` 的规则网格调 {@link VertexWriter}，顺序索引成三角形列表。 */
function buildGridMesh(cols: number, rows: number, write: VertexWriter): MeshBuffers {
  const vertexCount = (cols + 1) * (rows + 1);
  const indices = new Uint32Array(cols * rows * 6);
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const extras = new Float32Array(vertexCount * 2);
  let cursor = 0;
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= cols; col++) {
      const index = row * (cols + 1) + col;
      const vertex = write(index, cols === 0 ? 0 : col / cols, rows === 0 ? 0 : row / rows);
      positions[index * 3] = vertex.position[0];
      positions[index * 3 + 1] = vertex.position[1];
      positions[index * 3 + 2] = vertex.position[2];
      normals[index * 3] = vertex.normal[0];
      normals[index * 3 + 1] = vertex.normal[1];
      normals[index * 3 + 2] = vertex.normal[2];
      colors[index * 3] = vertex.color[0];
      colors[index * 3 + 1] = vertex.color[1];
      colors[index * 3 + 2] = vertex.color[2];
      extras[index * 2] = vertex.extra?.[0] ?? 0;
      extras[index * 2 + 1] = vertex.extra?.[1] ?? 0;
      if (col < cols && row < rows) {
        const next = index + cols + 1;
        indices[cursor++] = index;
        indices[cursor++] = index + 1;
        indices[cursor++] = next + 1;
        indices[cursor++] = index;
        indices[cursor++] = next + 1;
        indices[cursor++] = next;
      }
    }
  }
  return {
    positions,
    normals,
    colors,
    extras,
    indices,
    vertexCount,
    indexCount: indices.length,
    triangleCount: indices.length / 3,
  };
}

/** 确定性哈希 → [0,1)；几何布局每次刷新都一样，截图才能比对。 */
function hash(index: number, seed: number): number {
  let value = Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(seed + 1, 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 15), 0x2c1b3c6d);
  value = Math.imul(value ^ (value >>> 12), 0x297a2d39);
  return ((value ^ (value >>> 15)) >>> 0) / 0x100000000;
}

/** 与着色器里的 `channelWeight` **数值一致**：1 = 河道正中，0 = 完全在岸上。 */
function channelWeight(x: number, z: number, cameraZ: number): number {
  const depth = Math.max(cameraZ - z, 4);
  const halfWidth = channelHalfWidth(depth);
  const meander = meanderOffset(z, depth);
  const lateral = Math.abs(x - meander) / halfWidth;
  // 与着色器一致：比走廊网格更远的地方不再挖河道，免得留下一个洞。
  return (1 - smoothstep(0.62, 1, lateral)) * (1 - smoothstep(RIVER_DEPTH_LIMIT - 40, RIVER_DEPTH_LIMIT, depth));
}

/**
 * 地形网格：**横向范围随深度线性增长**。
 *
 * 这是这一页构图的关键：透视里「深度 d 处的可见半宽」正好正比于 d，所以只要让每行的
 * 横向覆盖也是 `常数 × d`，地形就永远铺满画面左右两侧（不会在近处露出画面外的空白，
 * 也不会在远处缩成一条）。1.25 倍深度（而不是 1.45 × 0.615 = 0.89 倍）留了足够余量：
 * 宽高比到 3.4 时画面边缘仍在网格之内，边缘的斜切面一定看不见。
 *
 * 远端（`TERRAIN_FAR`）的岸高约 0.7~1.8（相机高 8），所以地形远端的轮廓落在 `y ≈ 0.35`，
 * 正好压在地平线（0.33）稍下方 —— 上面那一条缝由山脊补上。
 */
function buildTerrainMesh(): MeshBuffers {
  const cameraZ = CAMERA_EYE[2];
  const depthAt = (v: number): number => TERRAIN_NEAR + (TERRAIN_FAR - TERRAIN_NEAR) * Math.pow(v, TERRAIN_V_POWER);
  return buildGridMesh(TERRAIN_COLS, TERRAIN_ROWS, (index, u, v) => {
    const depth = depthAt(v);
    // 列的位置由 hash 打散：均匀铺在远处会形成规则的四边形网格，看起来像「一块布」。
    const t = (u * 2 - 1) + (hash(index, 71) - 0.5) * (2 / TERRAIN_COLS);
    const sign = t < 0 ? -1 : 1;
    const magnitude = Math.pow(Math.abs(t), 1.12);
    const x = sign * magnitude * 1.25 * depth;
    const z = cameraZ - depth;
    const channel = channelWeight(x, z, cameraZ);
    // 河岸的基础高度：与 riverProfile / 着色器里的 terrainHeight 是同一份公式。
    const base = terrainHeightCpu(x, z, cameraZ);
    // 法线用**较大的横向步长**（0.6）求高度场的梯度。
    // 不能用小步长（0.18）：噪声的细节会被放大成近乎垂直的坡面，光照下整片近景会黑成一块。
    // 0.6 是「半个河宽」的量级，得到的是坡地的整体朝向。
    const ex = 0.6;
    const gradeX = (terrainHeightCpu(x + ex, z, cameraZ) - base) / ex;
    const gradeZ = (terrainHeightCpu(x, z + ex, cameraZ) - base) / ex;
    const normal = normalize3([-gradeX, 1, -gradeZ]);
    // 颜色：河岸是草地绿、坡上偏森林绿、高处偏干土。片元着色器会按同一份公式重算一遍
    //（顶点色在格距 3~13 个单位的网格上会糊成一块块），这里留着是为了 `?wire=1` 之外的自洽。
    const slope = clampMagnitude((fbm2(x * 0.34, z * 0.34) + noise2(x * 0.09, z * 0.09)) * 0.5);
    const dry = smoothstep(1.9, 3.3, base);
    const grass: readonly [number, number, number] = [0.3, 0.5, 0.19];
    const forest: readonly [number, number, number] = [0.13, 0.29, 0.13];
    const soil: readonly [number, number, number] = [0.44, 0.42, 0.34];
    const green = mixColor(grass, forest, slope);
    const color = mixColor(green, soil, dry * 0.75);
    // 备用通道：第 0 位是 channelWeight（调试/可视化用），第 1 位留 0。
    return {
      position: [x, groundHeightCpu(x, z, cameraZ), z],
      normal,
      color: [color[0], color[1], color[2]],
      extra: [channel, 0],
    };
  });
}

/** 地形的**顶点高度**就是平坦的河岸高度（河道那一段由走廊网格负责），与着色器逐字一致。 */
function groundHeightCpu(x: number, z: number, cameraZ: number): number {
  return terrainHeightCpu(x, z, cameraZ);
}

/**
 * 河道几何 —— 地形挖河道、河床 / 水面网格、种树都读这一份公式（着色器里有逐字对应的副本）。
 * 参数（{@link RIVER_WIDTH_RATIO} / {@link RIVER_MEANDER_CAP} / {@link RIVER_BED_SIDE} 等）
 * 声明在文件开头，因为着色器的模板字符串在模块求值时就要读它们。
 */
function channelHalfWidth(depth: number): number {
  return RIVER_WIDTH_RATIO * meanderScale(depth);
}

/** 摆动幅度与河道宽度的公共尺度：`depth` 小时 ≈ depth，`depth` 大时收敛到 {@link RIVER_MEANDER_CAP}。 */
function meanderScale(depth: number): number {
  const d = Math.max(depth, 4);
  return RIVER_MEANDER_CAP * (1 - Math.exp(-d / RIVER_MEANDER_CAP));
}

/** 河道中心线相对 `x = 0` 的横移。 */
function meanderOffset(z: number, depth: number): number {
  return (Math.sin(z * 0.021) * 0.34 + Math.sin(z * 0.0073) * 0.55) * meanderScale(depth);
}

/** 河岸高度（不含河道）：近岸贴着水面、远端缓慢抬升（见 GLSL 里 terrainHeight 的说明）。 */
function terrainHeightCpu(x: number, z: number, cameraZ: number): number {
  const depth = Math.max(cameraZ - z, 4);
  return (
    (depth / TERRAIN_FAR) * TERRAIN_RISE +
    TERRAIN_BASE +
    fbm2(x * TERRAIN_NOISE_FREQUENCY, z * TERRAIN_NOISE_FREQUENCY) * TERRAIN_NOISE_AMPLITUDE
  );
}

/**
 * 相机俯角（弧度，**向下看为正**）：由相机与目标点算出，{@link screenAngle} 要用。
 *
 * 这里必须写成 `atan2(眼高 - 目标高, 眼z - 目标z)`：两个分量都取「眼 - 目标」。
 * 旧版写成 `atan2(目标高 - 眼高, 目标z - 眼z)`（两个分量都取反），atan2 于是落进第三象限，
 * 得到 `-π + 0.124` 而不是 `0.124` —— 俯角差了将近 180°，`depthAtScreenRow` 的符号判断
 * 整个反掉：**画面上半（天空）被当成地面、下半（地面）被当成天空**，河道网格 67% 的行
 * 全部堆在相机脚下 3 个单位处，河于是碎成一团。
 */
const CAMERA_PITCH = Math.atan2(CAMERA_EYE[1] - CAMERA_TARGET[1], CAMERA_EYE[2] - CAMERA_TARGET[2]);

/**
 * 屏幕纵向位置 `v`（0 顶 1 底）对应的**视线俯角**（弧度，向下看为正）。
 *
 * 往下走 v 变大、俯角变大，所以是 `+`；地平线（俯角 0）落在 `v = 0.5 - pitch / FOV ≈ 0.33`。
 */
function screenAngle(v: number): number {
  return CAMERA_PITCH + (v - 0.5) * FOV;
}

/**
 * 「屏幕上一行」→「沿 -z 轴多远」。这是河道网格**最关键的参数化**。
 *
 * 旧版按「深度 = 近端 + 幂次插值」均匀铺行，结果 40 行里绝大多数落在屏幕外或挤在地平线附近的
 * 几个像素里 —— 实测水面网格只覆盖 583 个像素（0.1%），根本不成一条河。
 *
 * 正确的做法是**按屏幕行反推深度**：屏幕 y（0 顶 1 底）处的视线俯角是 {@link screenAngle}，
 * 相机高 `E` 看下去、地面在眼下方 `E`，于是沿视线水平前进的距离就是 `E / tan(俯角)`。
 * 镜头就是朝 -z 看的，所以这个水平距离就是沿 -z 的深度。
 */
function depthAtScreenRow(v: number): number {
  const tangent = Math.tan(screenAngle(v));
  // 视线在地平线以上（俯角 ≤ 0）时看不到地面，返回 0 让调用方跳过这一行。
  if (tangent <= 1e-4) return 0;
  return CAMERA_EYE[1] / tangent;
}

/**
 * 河道网格第 `v` 行（0 = 最远、1 = 最近）对应的深度。
 *
 * 顶行固定取在 `RIVER_TOP_SCREEN`（地形远端轮廓的稍下方），底行是画面底边（`v = 1`），
 * 中间按屏幕高度均匀铺 —— 于是**每一行在屏幕上分到的带高都差不多**，
 * 近处（画面下方）自然变密，河边不会被压成一条线。这就是「按可见范围裁剪」：
 * 网格不多铺一行到地平线以上（那里没有地面），也不会少铺到画面外的岸上。
 */
function riverDepthAtRow(v: number): number {
  const screen = RIVER_TOP_SCREEN + (1 - RIVER_TOP_SCREEN) * v;
  return Math.max(depthAtScreenRow(screen), TERRAIN_NEAR);
}

/** 河道走廊里的地面高度（河床 + 岸坡），走廊两端严格等于岸高。 */
function riverProfileHeight(x: number, z: number, cameraZ: number): number {
  const depth = Math.max(cameraZ - z, 4);
  const halfWidth = channelHalfWidth(depth);
  const meander = meanderOffset(z, depth);
  const lateral = Math.abs(x - meander) / halfWidth;
  const bank = terrainHeightCpu(x, z, cameraZ);
  // 剖面 = 河床底 → 岸高的平滑上升：`riverBankRise(1) === 1`，
  // 所以 `lateral >= 1`（走廊的边缘）处高度**就是**岸高，和地形拼得上（理由见 riverBankRise 的说明）。
  return RIVER_BED_DEPTH + (bank - RIVER_BED_DEPTH) * riverBankRise(lateral);
}

/** 走廊中心线。 */
function corridorCenter(z: number, depth: number): number {
  return meanderOffset(z, depth);
}

/** 走廊在该深度的横向半宽（世界单位）。 */
function corridorHalfWidth(depth: number): number {
  return channelHalfWidth(depth) * RIVER_BED_SIDE;
}

/**
 * 河床 / 水面网格（`flat = true` 时是水面）。
 *
 * **行按屏幕高度反推**（见 {@link riverDepthAtRow}）：网格在屏幕每一带都分到差不多多的行，
 * 近处自动变密、远端自然收敛。网格的深度范围就是**可见范围**：顶行落在 `y = 0.36`
 * （地形远端轮廓 0.35 的稍下方，再往上就没有地面了），底行落在画面底边（约 15 单位）。
 * 旧版按深度均匀铺行，46 行里一半挤在地平线附近的 7 个像素里、近处一行都没有。
 *
 * 水面用「一块平板」而不是跟着河床起伏的薄壳：平板与倾斜的岸坡自然相交，水面就止于水线，
 * 既不会在岸上铺出一层水，也不会出现「水面悬在河床上方」的穿帮。
 * 横向范围取 `1.02 × 河道半宽`，于是河床在两侧各露出一小条沙滩 ——
 * 这正是「河岸」的样子，也是「河水清浅」的视觉线索（沙滩由河床管线画）。
 */
function buildRiverMesh(flat: boolean): MeshBuffers {
  const cameraZ = CAMERA_EYE[2];
  return buildGridMesh(RIVER_COLS, RIVER_ROWS, (_index, u, v) => {
    // `v` 从 0（远）到 1（近）；`riverDepthAtRow` 已经保证结果落在地面上。
    const depth = riverDepthAtRow(v);
    const z = cameraZ - depth;
    const center = corridorCenter(z, depth);
    if (flat) {
      const half = channelHalfWidth(depth) * 1.02;
      const x = center + (u * 2 - 1) * half;
      // `extra.x` 带着**这一列下方河床的世界高度**：水面着色器据此判断「这一格水有多深」，
      // 浅到河床已经露出水面时就退化成湿沙色，水线的边缘不会出现一条突兀的亮边。
      return {
        position: [x, WATER_LEVEL, z],
        normal: [0, 1, 0],
        color: [0, 0, 0],
        extra: [riverProfileHeight(x, z, cameraZ), 0],
      };
    }
    const half = corridorHalfWidth(depth);
    const x = center + (u * 2 - 1) * half;
    const height = riverProfileHeight(x, z, cameraZ);
    // 法线用**横向有限差分**求：走廊的横截面是斜的，写成「永远朝上」会让岸坡的光照完全错掉。
    // 步长取 `half * 0.35`（而不是几个像素级的小量）：河床 → 岸坡的过渡在横向上很陡，
    // 步长太小会量出接近垂直的坡面，光照下整条河床会黑成一条黑带。
    const dx = Math.max(half * 0.35, 0.05);
    const slope = (riverProfileHeight(x + dx, z, cameraZ) - riverProfileHeight(x - dx, z, cameraZ)) / (2 * dx);
    const normal = normalize3([-slope * 0.6, 1, 0]);
    // `extra.x` 是这一点的世界高度（着色器据此把水下部分压暗），`extra.y` 是到中心的横向比。
    return {
      position: [x, height, z],
      normal,
      color: [1, 1, 1],
      extra: [height, Math.abs(x - center) / Math.max(half, 0.001)],
    };
  });
}

/**
 * 把「屏幕上的纵向位置」反解成「该深度处该有多高」。
 *
 * 屏幕 `y`（0 顶 1 底）对应的视线俯角是 {@link screenAngle}，站在相机高度 `eye` 上看
 * `depth` 远的地方，该处的高度就是 `eye - depth × tan(俯角)`。
 * 山脊幕布的上下边界都用它定位，于是「山脊占屏幕上哪一段」是**直接指定**的。
 */
function screenRowHeight(y: number, depth: number): number {
  return CAMERA_EYE[1] - depth * Math.tan(screenAngle(y));
}

/**
 * 山脊幕布：一块**世界坐标里的窄带**（不是从天上垂到地下的幕布）。
 *
 * 这是这一版重写过的地方。旧版把每一层做成「从 `base` 一直铺到脊线」的大幕布，
 * `base` 又是固定世界高度 —— 换一个相机之后幕布会一直垂到镜头下方，
 * 整屏都被这一层盖住（`?only=ridge` 时天空一像素不剩）。
 *
 * 现在幕布的上下边界由**屏幕位置**反解（{@link screenRowHeight}）：
 * `baseScreen` 是底边、`peakScreen` 是脊线，于是无论相机怎么摆，
 * 山脊都稳定地占屏幕上那一小段，天空与太阳始终露得出来。
 */
function buildRidgeMesh(spec: RidgeSpec): MeshBuffers {
  const z = CAMERA_EYE[2] - spec.depth;
  const halfWidth = ridgeHalfWidth(spec.depth);
  const base = screenRowHeight(spec.baseScreen, spec.depth);
  const peak = screenRowHeight(spec.peakScreen, spec.depth);
  return buildGridMesh(RIDGE_COLS, RIDGE_ROWS, (_index, u, v) => {
    const x = (u * 2 - 1) * halfWidth;
    // 底边 → 脊线之间插值；`ridgeShape` 只负责「哪一段高、哪一段低」的形状（0.45~1）。
    const shape = ridgeShape(x, spec);
    const ridge = base + (peak - base) * shape;
    const y = base + (ridge - base) * v;
    // 法线由脊线斜率推：面朝相机的一侧朝上、背面朝下（背面自然更暗）。
    const dx = 3.5;
    const slope = (ridgeHeight(x + dx, spec) - ridgeHeight(x - dx, spec)) / (2 * dx);
    const normal = normalize3([-slope * spec.scale * 0.35, 1, 0.5]);
    // 山脚更暗更冷、脊线更亮更暖：不用额外光照就有了「山的体积感」。
    const dark: readonly [number, number, number] = [
      spec.color[0] * 0.5 + 0.04,
      spec.color[1] * 0.5 + 0.04,
      spec.color[2] * 0.55 + 0.06,
    ];
    const color = mixColor(dark, spec.color, v);
    const shade = 0.72 + 0.46 * v;
    return {
      position: [x, y, z],
      normal,
      color: [color[0] * shade, color[1] * shade, color[2] * shade],
      extra: [spec.haze, v],
    };
  });
}

/**
 * 脊线高度（世界单位）：三层不同波长的正弦 + 一层噪声，得到连绵的山形。
 *
 * 频率全部由 {@link RidgeSpec.frequency} 决定（两层各自取值），相位由 {@link RidgeSpec.phase} 错开。
 * 返回值直接是「世界高度」，正比于 `scale`；调用方用 {@link ridgeShape} 归一化后插值到
 * 「底边 ~ 脊线」之间，所以「山脊在屏幕上占哪一段」由 `peakScreen` / `baseScreen` 说了算。
 */
function ridgeHeight(x: number, spec: RidgeSpec): number {
  const f = spec.frequency;
  const a = Math.sin(x * f + spec.phase) * 0.5 + 0.5;
  const b = Math.sin(x * f * 2.7 + spec.phase * 1.7) * 0.5 + 0.5;
  const c = Math.sin(x * f * 0.45 + spec.phase * 0.6) * 0.5 + 0.5;
  const n = fbm2(x * f * 0.35, spec.phase * 9);
  return (a * 0.4 + b * 0.24 + c * 0.16 + n * 0.28) * spec.scale;
}

/**
 * 把 {@link ridgeHeight} 归一化成 `0.45 ~ 1.0` 的「占幕布高度的比例」。
 *
 * 上下界是有意收紧的：**下界 0.45 保证幕布的下半段永远被填满**，否则山脊会在屏幕上
 * 断成一串互不相连的三角（旧版没有归一化，`clamp(...,0,1)` 之后大部分 x 都顶在 1，
 * 于是脊线是一条平顶的直线，看起来就是一块深色板子）；上界 1 保证最高的山头正好落在
 * `peakScreen` 那一行，山脊的屏幕位置可控。
 */
function ridgeShape(x: number, spec: RidgeSpec): number {
  const raw = ridgeHeight(x, spec) / spec.scale;
  return 0.45 + 0.55 * clampMagnitude((raw - 0.16) * 1.35);
}

/** 树干：六棱台（底 0.09、顶 0.05，高 0.6），12 个三角形。 */
function buildTrunkMesh(): MeshBuffers {
  const segments = 6;  const vertices: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle);
    const z = Math.sin(angle);
    vertices.push(x * 0.09, 0, z * 0.09, x * 0.05, 0.6, z * 0.05);
    normals.push(x, 0.15, z, x, 0.15, z);
  }
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    const a = i * 2;
    const b = i * 2 + 1;
    const c = next * 2;
    const d = next * 2 + 1;
    indices.push(a, b, d, a, d, c);
  }
  return fromAttributeLists(vertices, normals, indices, [0.6, 0.44, 0.3]);
}

/** 树冠：低面数球（6 段 × 4 环），顶点法线就是位置方向 —— 光照下自然分成明暗两半。 */
function buildCanopyMesh(): MeshBuffers {
  const segments = 6;
  const rings = 4;
  const vertices: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let ring = 0; ring <= rings; ring++) {
    const phi = (ring / rings) * Math.PI;
    for (let segment = 0; segment <= segments; segment++) {
      const theta = (segment / segments) * Math.PI * 2;
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      vertices.push(x * 0.34, y * 0.34 + 0.7, z * 0.34);
      normals.push(x, y, z);
    }
  }
  const stride = segments + 1;
  for (let ring = 0; ring < rings; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const a = ring * stride + segment;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, d, a, d, b);
    }
  }
  return fromAttributeLists(vertices, normals, indices, [0.3, 0.6, 0.26]);
}

/** 把「已经排好的属性数组 + 颜色」包装成 {@link MeshBuffers}（树干与树冠用）。 */
function fromAttributeLists(
  vertices: number[],
  normals: number[],
  indices: number[],
  color: readonly [number, number, number],
): MeshBuffers {
  const vertexCount = vertices.length / 3;
  return {
    positions: Float32Array.from(vertices),
    normals: Float32Array.from(normals),
    colors: Float32Array.from({ length: vertexCount * 3 }, (_value, index) => color[index % 3]!),
    extras: new Float32Array(vertexCount * 2),
    indices: Uint32Array.from(indices),
    vertexCount,
    indexCount: indices.length,
    triangleCount: indices.length / 3,
  };
}

/**
 * 把网格的三段属性数组**交织**成一条 44 字节的顶点记录，与 {@link MESH_VERTEX_LAYOUT} 对应。
 *
 * 这是全页唯一一处「顶点内存布局」的定义：交错之后一条记录就是一个顶点的全部属性，
 * 于是 `arrayStride`（44）与缓冲区的真实间距天然一致，`attribute.offset` 也正好是
 * 12 / 24 / 36 这三个常量。上一版让「位置」单独占一段缓冲却仍按 44 声明步长，
 * 越界读取把超过七成的顶点读成 0，几何体整体塌掉。
 */
function packMesh(mesh: MeshBuffers): Float32Array {
  const packed = new Float32Array(mesh.vertexCount * 11);
  for (let index = 0; index < mesh.vertexCount; index += 1) {
    packed.set(mesh.positions.subarray(index * 3, index * 3 + 3), index * 11);
    packed.set(mesh.normals.subarray(index * 3, index * 3 + 3), index * 11 + 3);
    packed.set(mesh.colors.subarray(index * 3, index * 3 + 3), index * 11 + 6);
    packed.set(mesh.extras.subarray(index * 2, index * 2 + 2), index * 11 + 9);
  }
  return packed;
}

/* ------------------------------------------------------------------------------------------------ */
/* 小工具（与着色器同名函数的 CPU 版本，只用于生成几何体）                                                  */
/* ------------------------------------------------------------------------------------------------ */

function fract(value: number): number {
  return value - Math.floor(value);
}

/**
 * 二维哈希 → [0,1)，与着色器里的 `hash21` **同一个公式**（CPU 用 double 算，末位会有差异；
 * 它只参与生成几何体与颜色，边界差一点点是亚像素级的影响）。
 */
function hash2(x: number, y: number): number {
  const qx = fract(x * 0.1031);
  const qy = fract(y * 0.103);
  const qz = fract(x * 0.0973);
  const dot = qx * qy + qy * qz + qz * qx + 33.33 * (qx + qy + qz);
  return fract((qx + qy) * (qz + dot));
}

function noise2(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy;
}

function fbm2(x: number, y: number): number {
  let total = 0;
  let amplitude = 0.5;
  let px = x;
  let py = y;
  for (let i = 0; i < 3; i++) {
    total += noise2(px, py) * amplitude;
    px = px * 2.07 + 13.1;
    py = py * 2.07 + 7.3;
    amplitude *= 0.5;
  }
  return total;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

function clampMagnitude(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function mixColor(
  left: readonly [number, number, number],
  right: readonly [number, number, number],
  t: number,
): [number, number, number] {
  return [left[0] + (right[0] - left[0]) * t, left[1] + (right[1] - left[1]) * t, left[2] + (right[2] - left[2]) * t];
}

function normalize3(value: readonly [number, number, number]): [number, number, number] {
  const length = Math.hypot(value[0], value[1], value[2]) || 1;
  return [value[0] / length, value[1] / length, value[2] / length];
}

/* ------------------------------------------------------------------------------------------------ */
/* 每棵树的实例数据                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

/**
 * 每棵树的实例数据：每实例 6 个 float —— `vec4(世界坐标 xyz, 缩放)` + `vec2(旋转角, 备用)`。
 *
 * **没有用「每实例一个 mat4」，也没有用每实例颜色**。更重要的是：顶点缓冲的**槽号必须与管线里
 * `vertex.buffers` 的数组下标一致** —— WebGPU 的 `setVertexBuffer(slot, ...)` 里的 slot 是
 * 「管线数组的下标」，不是 `@location(N)`。旧版按 shader location 编号去绑（位置 0/1、颜色 7、
 * 信息 8），WebGPU 因此在 slot 7/8 找不到东西、还把网格缓冲错当成实例缓冲
 * （校验错误：`Instance range requires 8320 but bound buffer size is 144`）。
 * 现在实例数据只有一段、落在数组下标 1，绑定的槽号与下标自然对得上。
 */
interface TreeInstances {
  /** 每实例 6 个 float：`[x, y, z, 缩放, 旋转角, 备用]`。 */
  readonly data: Float32Array;
  readonly count: number;
}

/**
 * 生成树林：位置撒在河两岸。
 *
 * 这里的采样不是「随便撒了再不合适就丢掉」，而是**先解出可行的横向区间再取随机值** ——
 * 因为要同时满足两个约束：
 *
 * 1. **不能长在河里**：离河道中心至少 1.6 倍河道半宽（别贴着水边长）；
 * 2. **必须在画面里**：深度 d 处的可见半宽约 `0.794 * d`，所以 `|x|` 要小于 `0.7 * d`。
 *
 * 河道中心本身按 `meander` 左右摆（摆幅被 {@link RIVER_MEANDER_CAP} 限制住），所以两个约束
 * 换算成「相对河道中心的横向倍数」之后是 `lateral >= 1.6` 与 `|meander ± lateral * halfWidth| <= 0.7 * d`。
 * 两者可能**没有交集**（河摆到画面边框上的那一段），这时就换一侧再试 —— 这也正好是
 * 「树只种在可见的岸上」的那个意思。
 *
 * 每棵树的世界高度取自与着色器同一套地面高度公式（{@link groundHeightCpu}）。
 */
function buildTreeInstances(count: number): TreeInstances {
  const cameraZ = CAMERA_EYE[2];
  const data = new Float32Array(count * 6);
  let placed = 0;
  for (let attempt = 0; attempt < count * 40 && placed < count; attempt++) {
    // 深度从 26 起：太近的树（深度 12）在 42° 视场里会像几块绿色的板子糊在镜头前，
    // 26 之后「近处的树」也还有半个屏幕高，但已经能看出是一棵棵的树了。
    const depth = 26 + Math.pow(hash(attempt, 3), 1.2) * (TERRAIN_FAR * 0.7 - 26);
    const z = cameraZ - depth;
    const halfWidth = channelHalfWidth(depth);
    const meander = meanderOffset(z, depth);
    const side = hash(attempt, 5) < 0.5 ? -1 : 1;
    // 解可行区间：minLateral 来自「别长在河里」，maxLateral 来自「别长出画面」。
    // 1.6 让树离开水边一段距离（河岸上不会有树贴着水长），画面里也更容易看出「岸」。
    const minLateral = 1.6;
    // 可见半宽 ≈ `0.794 × 深度`（42° 垂直 FOV、宽高比 2.18），取 0.7 留一点边：
    // 树要铺满画面左右两侧的岸，而不是全挤在中间（旧版取 0.6 且按 0.615 估算，偏窄）。
    const maxLateral = Math.min(6, (0.7 * depth - side * meander) / halfWidth);
    if (maxLateral <= minLateral) continue;
    const lateral = minLateral + Math.pow(hash(attempt, 7), 1.3) * (maxLateral - minLateral);
    const x = meander + side * lateral * halfWidth;
    if (channelWeight(x, z, cameraZ) > 0.12) continue;
    const height = groundHeightCpu(x, z, cameraZ);
    if (height < WATER_LEVEL + 0.5) continue;

    // 尺寸偏小的一侧更多（1.5 次方）：远处一片小树、近处偶尔一棵大的，才像树林。
    // 1.0~3.2 的缩放（树高约 1 个单位）对应 1~3.3 个世界单位高：深度 26 处约 60~200 像素，
    // 深度 150 处约 10~35 像素 —— 近处能看出是一棵棵的树，远处仍是一片林。
    const scale = 1.0 + Math.pow(hash(attempt, 11), 1.5) * 2.2;
    data[placed * 6] = x;
    data[placed * 6 + 1] = height;
    data[placed * 6 + 2] = z;
    data[placed * 6 + 3] = scale;
    data[placed * 6 + 4] = hash(attempt, 13) * Math.PI * 2;
    data[placed * 6 + 5] = 0;
    placed += 1;
  }
  return { data, count: placed };
}

/* ------------------------------------------------------------------------------------------------ */
/* 主流程                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

interface SceneParams {
  forest: boolean;
  waterClarity: number;
  waterReflect: number;
  sunElevation: number;
  sunAzimuth: number;
  animate: boolean;
  wireframe: boolean;
  fog: number;
  /** 调试用：`?only=terrain` 时只画某一层（`terrain` / `ridge` / `bed` / `water` / `sky`）。 */
  only: string;
  /** 调试用：`?ridges=0|1|2` 控制画几层山脊。 */
  ridges: number;
}

async function main(): Promise<void> {
  const canvas = requireElement<HTMLCanvasElement>('view');
  const statusEl = requireElement<HTMLSpanElement>('status');
  const statsEl = requireElement<HTMLSpanElement>('stats');
  const query = new URLSearchParams(location.search);
  const example = await createCoreExample(canvas, backendFromQuery(query), 'core-landscape');
  const { device, context } = example;

  /* ---- 参数：查询参数优先，其次 lil-gui 的默认值 ---------------------------------------------- */
  const timeParam = Number(query.get('t'));
  const fixedTime = query.has('t') && Number.isFinite(timeParam) ? timeParam : null;
  const params: SceneParams = {
    forest: query.get('forest') !== '0',
    waterClarity: clampRange(readSunOrWater(query.get('water')), 0.05, 1, 0.62),
    waterReflect: 0.62,
    /**
     * 太阳高度角 / 方位角。
     *
     * 默认值是按**屏幕位置**反解出来的：方位角 -1.2185、高度角 0.138 让太阳落在
     * `u ≈ 0.72, v ≈ 0.14`（画面右上角的天空里，高度约 8°）。低太阳 + 逆光让山脊与树林
     * 变成剪影（「山脊比天空暗」这条判据因此有东西可量），同时水面能反射到它、出现波纹高光。
     *
     * 旧版写的是 0.22 / -1.3：太阳落在 `v ≈ 0.03`，圆盘几乎贴在屏幕上沿（实测探针
     * 落在屏幕外，`brightestRegion` 只好在别处随便挑一块「最亮」的）。
     * 高度角与方位角的耦合关系：`tan(方位偏移) = x / (-z)`、`高度角 = asin(y)`。
     */
    sunElevation: clampRange(readSunOrWater(query.get('sun')), 0.08, 1.45, 0.138),
    // 方位角从 +X 轴起算，相机看向 -Z，所以「太阳在画面里」的方位角在 -π/2 附近。
    // 旧版写的是 0.24（约 14°），太阳落在**相机背后**，画面里既没有太阳也没有水面反光，
    // 自检的太阳屏幕坐标算出来是 -1854,1584 这种明显跑飞的值。
    sunAzimuth: -1.2185,
    animate: !(query.has('wspin') && Number(query.get('wspin')) === 0),
    wireframe: query.get('wire') === '1',
    fog: query.get('fog') === '0' ? 0 : FOG_DEFAULT,
    only: query.get('only') ?? '',
    ridges: clampRange(readSunOrWater(query.get('ridges')), 0, 2, 2),
  };

  /* ---- 几何体与缓冲 ---------------------------------------------------------------------------- */
  const terrain = buildTerrainMesh();
  const riverbed = buildRiverMesh(false);
  const water = buildRiverMesh(true);
  const ridgeMeshes = RIDGES.map((spec) => buildRidgeMesh(spec));
  const trunk = buildTrunkMesh();
  const canopy = buildCanopyMesh();
  let trees = buildTreeInstances(TREE_COUNT);

  const upload = (label: string, data: Float32Array | Uint32Array): ReturnType<typeof device.createBuffer> => {
    const buffer = device.createBuffer({
      label,
      size: data.byteLength,
      usage: BufferUsage.Vertex | BufferUsage.CopyDst,
    });
    device.queue.writeBuffer(buffer, 0, data);
    // 索引缓冲要用 Index | CopyDst，顶点用法的 buffer 不能绑成索引缓冲。
    return buffer;
  };
  const uploadIndex = (label: string, data: Uint32Array): ReturnType<typeof device.createBuffer> => {
    const buffer = device.createBuffer({
      label,
      size: data.byteLength,
      usage: BufferUsage.Index | BufferUsage.CopyDst,
    });
    device.queue.writeBuffer(buffer, 0, data);
    return buffer;
  };

  interface MeshGpu {
    /** 交错后的唯一一段顶点缓冲（44 字节一条记录，见 {@link MESH_VERTEX_LAYOUT}）。 */
    readonly vertex: ReturnType<typeof device.createBuffer>;
    readonly index: ReturnType<typeof device.createBuffer>;
    readonly mesh: MeshBuffers;
  }

  const toGpu = (label: string, mesh: MeshBuffers): MeshGpu => ({
    vertex: upload(`${label}:vertex`, packMesh(mesh)),
    index: uploadIndex(`${label}:index`, mesh.indices),
    mesh,
  });

  const terrainGpu = toGpu('landscape:terrain', terrain);
  const riverbedGpu = toGpu('landscape:riverbed', riverbed);
  const waterGpu = toGpu('landscape:water', water);
  const ridgeGpu = ridgeMeshes.map((mesh, index) => toGpu(`landscape:ridge${index}`, mesh));
  // 树干 / 树冠：extra 通道里塞「这是哪个部件」，与其它网格共用同一段布局。
  const trunkGpu = toGpu('landscape:trunk', withPart(trunk, 0));
  const canopyGpu = toGpu('landscape:canopy', withPart(canopy, 1));

  const instanceBuffer = device.createBuffer({
    label: 'landscape:treeInstances',
    size: trees.data.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  const writeTreeBuffers = (): void => {
    device.queue.writeBuffer(instanceBuffer, 0, trees.data, 0, trees.count * 6);
  };
  writeTreeBuffers();

  // 天空只用一个覆盖裁剪空间的大三角形（比四边形少一次对角线插值，且必然铺满）。
  const skyVertices = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]);
  const skyBuffer = device.createBuffer({
    label: 'landscape:sky',
    size: skyVertices.byteLength,
    usage: BufferUsage.Vertex | BufferUsage.CopyDst,
  });
  device.queue.writeBuffer(skyBuffer, 0, skyVertices);

  /* ---- uniform -------------------------------------------------------------------------------- */
  const uniformData = new Float32Array(UNIFORM_BYTES / 4);
  const uniforms = createUniformBinding(device, { name: 'Uniforms', size: UNIFORM_BYTES });

  /* ---- 管线 ----------------------------------------------------------------------------------- */
  /**
   * 网格管线共用的顶点布局：**一个槽位、四个属性**，`arrayStride` 就是 44。
   *
   * 槽位号（`vertex.buffers` 的数组下标）与 GLSL 的 `layout(location = N)` 在这里恰好一一对应，
   * 但两者是**两件事**：`setVertexBuffer(slot, ...)` 的第一参数始终是数组下标，
   * 两个后端在这件事上语义完全相同（WebGL2 的 `buildVertexArrayKey` 也是按数组下标遍历的）。
   */
  const meshBuffers = [MESH_VERTEX_LAYOUT];

  const layout = device.createPipelineLayout({
    label: 'landscape:pipelineLayout',
    bindGroupLayouts: [uniforms.layout],
  });

  const makeModule = (label: string, vs: string, fs: string, wgsl: string): ReturnType<typeof device.createShaderModule> =>
    device.createShaderModule({ label, code: { vs, fs, wgsl } });

  const skyModule = makeModule('landscape:skyShader', SKY_VERTEX_GLSL, SKY_FRAGMENT_GLSL, SKY_WGSL);
  const ridgeModule = makeModule('landscape:ridgeShader', RIDGE_VERTEX_GLSL, RIDGE_FRAGMENT_GLSL, RIDGE_WGSL);
  const terrainModule = makeModule('landscape:terrainShader', TERRAIN_VERTEX_GLSL, TERRAIN_FRAGMENT_GLSL, TERRAIN_WGSL);
  const riverbedModule = makeModule('landscape:riverbedShader', RIVERBED_VERTEX_GLSL, RIVERBED_FRAGMENT_GLSL, RIVERBED_WGSL);
  const treeModule = makeModule('landscape:treeShader', TREE_VERTEX_GLSL, TREE_FRAGMENT_GLSL, TREE_WGSL);
  const waterModule = makeModule('landscape:waterShader', WATER_VERTEX_GLSL, WATER_FRAGMENT_GLSL, WATER_WGSL);

  const skyPipeline = device.createRenderPipeline({
    label: 'landscape:skyPipeline',
    layout,
    vertex: {
      module: skyModule,
      entryPoint: 'vsMain',
      buffers: [{ arrayStride: 12, stepMode: 'vertex', attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] }],
    },
    fragment: { module: skyModule, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    // 天空最先画、铺满视口，而且**不写深度**。
    //
    // `depthWriteEnabled: false` 不能省：WebGPU 那边 `format: null` 只表示「管线不声明深度格式」，
    // 真正建 pipeline 时深度格式由当前 render target 决定，而没写出来的深度字段会落到默认值
    //（`depthWriteEnabled: true` + `depthCompare: 'less'`，见 src/core/pipeline/RenderState.ts 的
    // `DEFAULT_DEPTH_STATE`）。天空三角形的 `gl_Position` 是 `vec4(位置, 1)`，深度正好是 **0**，
    // 于是它会把整个深度缓冲写成 0，后面所有几何体的深度都大于 0、`less` 全部失败 ——
    // 画面上只剩天空一片（实测 WebGPU：探针读到的全是天空色 127,156,191，而分层 `?only=terrain`
    // 单独渲染时地形明明画得出来）。WebGL2 的 `format: null` 走的是「关掉深度测试」那条路，
    // 所以只有 WebGPU 会露出这个症状 —— 显式关掉深度写入，两个后端就都对了。
    depthStencil: { format: null, depthWriteEnabled: false },
  });

  const ridgePipeline = device.createRenderPipeline({
    label: 'landscape:ridgePipeline',
    layout,
    vertex: { module: ridgeModule, entryPoint: 'vsMain', buffers: meshBuffers },
    fragment: { module: ridgeModule, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
  });

  const terrainPipeline = device.createRenderPipeline({
    label: 'landscape:terrainPipeline',
    layout,
    vertex: { module: terrainModule, entryPoint: 'vsMain', buffers: meshBuffers },
    fragment: { module: terrainModule, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
  });

  const riverbedPipeline = device.createRenderPipeline({
    label: 'landscape:riverbedPipeline',
    layout,
    vertex: { module: riverbedModule, entryPoint: 'vsMain', buffers: meshBuffers },
    fragment: { module: riverbedModule, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
  });

  const treePipeline = device.createRenderPipeline({
    label: 'landscape:treePipeline',
    layout,
    vertex: {
      module: treeModule,
      entryPoint: 'vsMain',
      // 数组下标 0 = 网格、1 = 每实例数据。**槽号必须等于这里的下标** ——
      // `setVertexBuffer(slot, ...)` 里的 slot 是「管线 `vertex.buffers` 的数组下标」，
      // 不是着色器的 `@location(N)`（WebGL2 的 `buildVertexArrayKey` 也是按数组下标遍历的，
      // 两个后端在这件事上没有语义分歧）。
      buffers: [
        // 槽位 0：网格（位置 + 法线，同一段 44 字节交错的数据）。
        TREE_MESH_VERTEX_LAYOUT,
        // 槽位 1：每实例数据 vec4(世界坐标 xyz, 缩放) + vec2(旋转角, 备用)，共 24 字节。
        {
          arrayStride: 24,
          stepMode: 'instance',
          attributes: [
            { shaderLocation: 3, offset: 0, format: 'float32x4' },
            { shaderLocation: 8, offset: 16, format: 'float32x2' },
          ],
        },
      ],
    },
    fragment: { module: treeModule, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { depthWriteEnabled: true, depthCompare: 'less' },
  });

  /**
   * 水面管线：这是这一页唯一一条**带混合、且关掉深度写入**的管线。
   *
   * - `depthCompare: 'less'`：水面仍然要被河岸/树林挡住（深度测试开着）；
   * - `depthWriteEnabled: false`：水面自己不写深度 —— 河床是在它之前画的，
   *   如果水写了深度，后面的任何透明物体就没法再画了；更关键的是水面是一层薄壳，
   *   写深度会让它自遮挡出条纹。
   * - `blend`：直通 alpha，混合出「看得见河床」的效果。
   */
  const waterPipeline = device.createRenderPipeline({
    label: 'landscape:waterPipeline',
    layout,
    vertex: { module: waterModule, entryPoint: 'vsMain', buffers: meshBuffers },
    fragment: { module: waterModule, entryPoint: 'fsMain' },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { depthWriteEnabled: false, depthCompare: 'less' },
    render: {
      blend: {
        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
      },
    },
  });

  /* ---- 矩阵与 uniform 写入 --------------------------------------------------------------------- */
  const projectionGL = mat4.create();
  const projectionZO = mat4.create();
  const view = mat4.create();
  const viewProjection = mat4.create();
  const inverseViewProjection = mat4.create();
  const eye = vec3.fromValues(...CAMERA_EYE);
  const target = vec3.fromValues(...CAMERA_TARGET);
  const up = vec3.fromValues(0, 1, 0);

  const sunDirection = vec3.create();
  /** 上一帧算出的太阳屏幕坐标（`verify=1` 时写进 `data-landscape-sun-screen`）。 */
  let sunScreen: readonly [number, number] = [0, 0];

  const writeUniforms = (elapsed: number): void => {
    const aspect = context.height === 0 ? 1 : context.width / context.height;
    // 两个后端的投影差别（NDC 的 z 范围）在这里选：WebGPU 用 0..1，WebGL2 用 -1..1。
    mat4.perspective(projectionGL, FOV, aspect, NEAR_PLANE, FAR_PLANE);
    mat4.perspectiveZO(projectionZO, FOV, aspect, NEAR_PLANE, FAR_PLANE);
    mat4.lookAt(view, eye, target, up);
    mat4.multiply(viewProjection, example.backend === 'webgpu' ? projectionZO : projectionGL, view);
    // 天空着色器要把裁剪空间坐标反投影成视线方向，所以得把逆矩阵也传进去。
    mat4.invert(inverseViewProjection, viewProjection);

    const elevation = params.sunElevation;
    const azimuth = params.sunAzimuth;
    const cosElevation = Math.cos(elevation);
    const direction: [number, number, number] = [
      Math.cos(azimuth) * cosElevation,
      Math.sin(elevation),
      Math.sin(azimuth) * cosElevation,
    ];
    const length = Math.hypot(direction[0], direction[1], direction[2]) || 1;
    sunDirection[0] = direction[0] / length;
    sunDirection[1] = direction[1] / length;
    sunDirection[2] = direction[2] / length;

    uniformData.set(viewProjection, 0);
    uniformData.set(inverseViewProjection, 16);
    uniformData[32] = CAMERA_EYE[0];
    uniformData[33] = CAMERA_EYE[1];
    uniformData[34] = CAMERA_EYE[2];
    uniformData[35] = 0;
    uniformData[36] = sunDirection[0]!;
    uniformData[37] = sunDirection[1]!;
    uniformData[38] = sunDirection[2]!;
    uniformData[39] = 1;
    uniformData[40] = elapsed;
    uniformData[41] = params.fog;
    uniformData[42] = 1; // 山脊用的雾强度，1 表示用 params.fog
    uniformData[43] = params.wireframe ? 1 : 0;
    uniformData[44] = params.waterClarity;
    uniformData[45] = params.waterReflect;
    uniformData[46] = 0;
    uniformData[47] = 0;
    uniforms.write(uniformData);

    // 太阳的屏幕坐标：把「相机前方 100 单位、位于太阳方向上」的点投到 NDC 再换算成像素。
    // 自检的太阳区探针就用它的 0.5 倍位置当中心，不靠「猜画面哪里最亮」。
    const probe = vec3.create();
    vec3.scale(probe, sunDirection, 100);
    vec3.add(probe, eye, probe);
    const clip = [0, 0, 0, 0];
    const matrix = example.backend === 'webgpu' ? projectionZO : projectionGL;
    projectPoint(clip, probe, view, matrix);
    sunScreen = [
      (clip[0]! / clip[3]! * 0.5 + 0.5) * context.width,
      (0.5 - clip[1]! / clip[3]! * 0.5) * context.height,
    ];
  };

  /* ---- 绘制 ----------------------------------------------------------------------------------- */
  let drawCalls = 0;
  let triangles = 0;

  const bindMesh = (pass: RenderPassEncoder, mesh: MeshGpu): void => {
    // 一个槽位就够了：位置 / 法线 / 颜色 / 备用都在这段 44 字节的记录里。
    pass.setVertexBuffer(0, mesh.vertex, 0, mesh.vertex.size);
    pass.setIndexBuffer(mesh.index, 'uint32', 0, mesh.index.size);
  };

  const drawMesh = (pass: RenderPassEncoder, mesh: MeshGpu): void => {
    bindMesh(pass, mesh);
    pass.drawIndexed({ indexCount: mesh.mesh.indexCount });
    drawCalls += 1;
    triangles += mesh.mesh.triangleCount;
  };

  const drawScene = (pass: RenderPassEncoder): void => {
    drawCalls = 0;
    triangles = 0;
    // `?only=<层>` 只画其中一层（调试用：排查「画面里到底是哪一层铺满了」）。
    const only = params.only;
    const want = (name: string): boolean => only === '' || only === name;
    // 1) 天空：铺满视口，不打深度。
    if (want('sky')) {
      pass.setPipeline(skyPipeline);
      pass.setBindGroup(0, uniforms.bindGroup);
      pass.setVertexBuffer(0, skyBuffer, 0, skyBuffer.size);
      pass.draw({ vertexCount: 3 });
      drawCalls += 1;
      triangles += 1;
    }

    pass.setBindGroup(0, uniforms.bindGroup);
    // 2) 两层山脊（远 → 近，虽然深度测试本身就够，但这样读起来更清楚）。
    if (want('ridge')) {
      pass.setPipeline(ridgePipeline);
      for (const ridge of ridgeGpu.slice(0, params.ridges)) drawMesh(pass, ridge);
    }
    // 3) 地形（河岸 + 山坡；河道处 discard）。
    if (want('terrain')) {
      pass.setPipeline(terrainPipeline);
      drawMesh(pass, terrainGpu);
    }
    // 4) 河床：必须先于水面画，否则水面混合时底下什么都没有。
    if (want('bed')) {
      pass.setPipeline(riverbedPipeline);
      drawMesh(pass, riverbedGpu);
    }
    // 5) 树林：树干一次 draw call、树冠一次 draw call。
    if (params.forest && trees.count > 0 && want('tree')) {
      pass.setPipeline(treePipeline);
      for (const part of [trunkGpu, canopyGpu]) {
        // 槽位 0 是网格（44 字节交织）、槽位 1 是每实例数据（24 字节）——
        // 必须与管线里 `vertex.buffers` 的数组下标一致（`setVertexBuffer` 的 slot 就是数组下标）。
        pass.setVertexBuffer(0, part.vertex, 0, part.vertex.size);
        pass.setIndexBuffer(part.index, 'uint32', 0, part.index.size);
        pass.setVertexBuffer(1, instanceBuffer, 0, trees.count * 24);
        pass.drawIndexed({ indexCount: part.mesh.indexCount, instanceCount: trees.count });
        drawCalls += 1;
        triangles += part.mesh.triangleCount * trees.count;
      }
    }
    // 6) 水面：最后画，混合 + 不写深度。
    if (want('water')) {
      pass.setPipeline(waterPipeline);
      drawMesh(pass, waterGpu);
    }
  };

  let elapsed = 0;
  let frameTime = fixedTime ?? 0;

  const drawToCanvas = (delta: number): void => {
    context.resize();
    if (params.animate && fixedTime === null) frameTime += delta;
    elapsed = frameTime;
    writeUniforms(elapsed);
    // 走 `createPassDescriptor()`：两个后端的画布通道都带上深度附件（漏掉它深度测试会被静默关掉）。
    const descriptor = context.createPassDescriptor({
      loadOp: 'clear',
      storeOp: 'store',
      clearValue: CLEAR,
      depthLoadOp: 'clear',
      depthClearValue: 1,
    });
    const encoder = device.createCommandEncoder({ label: 'landscape:frame' });
    const pass = encoder.beginRenderPass({
      label: 'landscape:pass',
      colorAttachments: descriptor.colorAttachments,
      depthStencilAttachment: descriptor.depthStencilAttachment,
    });
    drawScene(pass);
    pass.end();
    device.queue.submit([encoder.finish()]);
    setData('landscapeDrawCalls', String(drawCalls));
    setData('landscapeTriangles', String(triangles));
  };

  drawToCanvas(0);
  setData('landscapeResult', 'ok');
  // 诊断用：把「河道网格按可见范围裁剪出来的深度区间」和「河最宽处的宽度」写出来，
  // 出问题时一眼能看出是裁剪错了（区间离谱）还是宽度错了（河细成一条线）。
  setData(
    'landscapeDiag',
    `trees=${trees.count}` +
      ` riverDepth=${riverDepthAtRow(0).toFixed(0)}..${riverDepthAtRow(1).toFixed(0)}` +
      ` riverFullWidth=${(channelHalfWidth(400) * 2).toFixed(2)}` +
      ` bankAt50=${terrainHeightCpu(0, CAMERA_EYE[2] - 50, CAMERA_EYE[2]).toFixed(2)}`,
  );
  statusEl.textContent =
    `后端：${example.backend}　设备：${example.adapter}　` +
    `6 条管线 / 8 次 draw call　天空 1 + 山脊 2 + 地形 1 + 河床 1 + 树林 2 + 水面 1`;

  startFrameLoop({
    draw: (delta) => drawToCanvas(delta),
    onFps: (fps) => {
      statsEl.textContent =
        `${context.width}×${context.height}　${fps.toFixed(0)} FPS　三角形 ${triangles}　` +
        `draw calls ${drawCalls}　树 ${params.forest ? trees.count : 0}`;
    },
  });

  /* ---- lil-gui：调试面板（自检不依赖它，`?gui=0` 时完全不建） ------------------------------------ */
  if (query.get('gui') !== '0') {
    const gui = new GUI({ title: '风景参数' });
    gui.add(params, 'forest').name('树林').onChange(() => {
      if (params.forest) {
        trees = buildTreeInstances(TREE_COUNT);
        writeTreeBuffers();
      }
    });
    gui.add(params, 'waterClarity', 0.05, 1, 0.01).name('水面透明度');
    gui.add(params, 'waterReflect', 0, 1, 0.01).name('水面反射');
    gui.add(params, 'sunElevation', 0.08, 1.45, 0.01).name('太阳高度角');
    gui.add(params, 'sunAzimuth', -2.2, -0.4, 0.01).name('太阳方位角');
    gui.add(params, 'fog', 0, 0.01, 0.0005).name('雾');
    gui.add(params, 'animate').name('水面流动');
    gui.add(params, 'wireframe').name('线框');
  }

  /* ---- 离屏自检 + 分区探针 --------------------------------------------------------------------- */
  if (query.get('verify') === '1') {
    // 先把画布尺寸同步一次：探针的分区是按「归一化屏幕坐标」定义的，而离屏目标的宽高比
    // 又是从 `context.width / context.height` 算的。页脚里的状态文字刚被改写，布局可能变过，
    // 不刷新的话这一帧的投影宽高比会和画布当前的宽高比对不上。
    context.resize();
    /**
     * 离屏目标的分辨率**按画布的宽高比**取。
     *
     * 这一点很关键：投影矩阵用的是画布宽高比（`context.width / context.height`），
     * 如果离屏目标固定成 16:9 而画布是 940×431（2.18），两者的水平视场就不一样，
     * 屏幕上算出来的 u 坐标（太阳、河道中心）与离屏图里的位置对不上，
     * 探针会打在错误的地方。宽高比一致之后，归一化坐标在两个后端、两块目标上含义相同。
     */
    const aspect = context.height === 0 ? 16 / 9 : context.width / context.height;
    const verifyHeight = VERIFY_HEIGHT;
    const verifyWidth = Math.max(64, Math.round(verifyHeight * aspect));
    const pixels = await readOffscreen(
      device,
      verifyWidth,
      verifyHeight,
      CLEAR,
      example.backend === 'webgl2',
      (pass) => {
        writeUniforms(fixedTime ?? 0);
        drawScene(pass);
      },
    );

    // 分区探针 1：天空。取**画面左上角**那一片（右半边是太阳与它的光晕），
    // 上边界 0.02 避开画布边缘的插值，下边界 0.22 仍在地平线（0.33）以上，所以整块必然是天空。
    const sky = regionStats(pixels, verifyWidth, verifyHeight, 0.03, 0.3, 0.03, 0.2);
    // 分区探针 2：太阳。用**运行时算出来的太阳屏幕坐标**定位，而不是「找画面哪儿最亮」——
    // 这样它天然证明了「最亮的那块 == 主光方向投影出来的位置」。
    const sunU = sunScreen[0] / Math.max(context.width, 1);
    const sunV = sunScreen[1] / Math.max(context.height, 1);
    const sun = regionAt(pixels, verifyWidth, verifyHeight, Math.round(sunU * verifyWidth), Math.round(sunV * verifyHeight));
    const brightest = brightestRegion(pixels, verifyWidth, verifyHeight, 0, 0.45);
    // 分区探针 3：山脊。两层山脊的脊线在屏幕 0.27 / 0.17，地形轮廓在 0.35，
    // 所以 0.24~0.33 这一带**只可能是山脊**（下面还没有地形，上面是天空）。
    const ridge = darkestRegion(pixels, verifyWidth, verifyHeight, 0.2, 0.8, 0.24, 0.33);
    // 分区探针 4：河面。同样由几何算出：取屏幕 0.72 那一行，反推深度 → 河道中心的世界 x → 投影。
    const riverRow = 0.72;
    const riverDepth = depthAtScreenRow(riverRow);
    const riverZ = CAMERA_EYE[2] - riverDepth;
    const riverX = meanderOffset(riverZ, riverDepth);
    const riverU = projectToScreen(riverX, WATER_LEVEL, riverZ, view, example.backend === 'webgpu' ? projectionZO : projectionGL)[0];
    const river = regionStats(pixels, verifyWidth, verifyHeight, riverU - 0.024, riverU + 0.024, riverRow - 0.03, riverRow + 0.03);

    setData('landscapeProbeSky', meanText(sky));
    setData('landscapeProbeSun', meanText(sun));
    setData('landscapeProbeSunAt', `${sun.x},${sun.y}`);
    setData('landscapeProbeSunWanted', `${Math.round(sunU * verifyWidth)},${Math.round(sunV * verifyHeight)}`);
    setData('landscapeProbeBrightestAt', `${brightest.x},${brightest.y}`);
    setData('landscapeProbeRidge', meanText(ridge));
    setData('landscapeProbeRiver', meanText(river));
    setData('landscapeProbeRiverAt', `${river.x},${river.y}`);
    setData('landscapeRiverDistinct', String(river.distinct));
    setData('landscapeRiverSpread', river.spread.toFixed(1));
    setData('landscapeSunScreen', `${sunScreen[0].toFixed(1)},${sunScreen[1].toFixed(1)}`);

    // 逐个判据（都是「天空铺满 + 五个元素都能认出来」的量化形式）：
    // 天空偏蓝（蓝 > 红）、且明显不是清屏色；
    const skyIsBlue = sky.mean[2] - sky.mean[0] > 12;
    const skyNotClear = Math.abs(sky.mean[0] - 184) + Math.abs(sky.mean[1] - 26) + Math.abs(sky.mean[2] - 158) > 60;
    // 太阳很亮（白盘把三个通道都压到接近饱和）；
    const sunIsBright = sun.mean[0] + sun.mean[1] + sun.mean[2] > 600;
    // 画面里最亮的那一小块**就在主光方向投影出来的位置上**（容差 10% 的屏幕尺寸）。
    // 这一条把「太阳画的位置」与「照亮整个场景的光照方向」绑在一起。
    // 容差不取更小：圆盘本身只有十来个像素，5×5 的滑窗压在饱和的晕上时，
    // 取到最大值的位置可以在盘心附近滑动几个百分点；这条判据要抓的是「最亮的东西跑到了别处」
    //（例如上一版探针落在屏幕外，`brightestRegion` 只好在树林里随便挑一块「最亮」的）。
    const sunAligned =
      Math.abs(brightest.x / verifyWidth - sunU) < 0.1 && Math.abs(brightest.y / verifyHeight - sunV) < 0.1;
    // 山脊比天空暗很多；
    const ridgeIsDarker = luminance(ridge.mean) < luminance(sky.mean) * 0.55;
    // 河面偏青蓝、而且有多种色调（说明河床透上来了，不是一块纯色）；
    const riverIsBlue = river.mean[2] - river.mean[0] > 10;
    const riverShowsBed = river.distinct >= 24 && river.spread >= 4;
    // 时间真的在动：同一块**河面**在 t 与 t+6 两次渲染之间必须出现像素差。
    // 用 5×5 均值是证明不了「时间在动」的（波纹相位不同但均值可以逐字相同），
    // 所以这里量的是整块区域的**逐像素平均绝对差**；同时量一块天空作为对照 ——
    // 天空不随时间变，它的差应当接近 0，这样「有差」才确实来自水面波纹而不是别的抖动量。
    const later = await readOffscreen(
      device,
      verifyWidth,
      verifyHeight,
      CLEAR,
      example.backend === 'webgl2',
      (pass) => {
        writeUniforms((fixedTime ?? 0) + 6);
        drawScene(pass);
      },
    );
    const riverDiff = regionDifference(pixels, later, verifyWidth, verifyHeight, riverU - 0.024, riverU + 0.024, riverRow - 0.03, riverRow + 0.03);
    const skyDiff = regionDifference(pixels, later, verifyWidth, verifyHeight, 0.03, 0.3, 0.03, 0.2);
    setData('landscapeTimeDiff', riverDiff.mean.toFixed(2));
    setData('landscapeTimeDiffMax', String(riverDiff.max));
    setData('landscapeTimeChanged', `${(riverDiff.changed * 100).toFixed(0)}%`);
    setData('landscapeTimeDiffSky', skyDiff.mean.toFixed(2));
    setData('landscapeTimeChangedSky', `${(skyDiff.changed * 100).toFixed(0)}%`);
    const waterAnimates = riverDiff.changed > 0.25 && riverDiff.max >= 8 && skyDiff.changed < 0.05;

    const checks: readonly (readonly [string, boolean])[] = [
      ['sky-blue', skyIsBlue],
      ['sky-not-clear', skyNotClear],
      ['sun-bright', sunIsBright],
      ['sun-aligned', sunAligned],
      ['ridge-darker', ridgeIsDarker],
      ['river-blue', riverIsBlue],
      ['river-bed', riverShowsBed],
      ['water-animates', waterAnimates],
    ];
    const passed = checks.filter((entry) => entry[1]).map((entry) => entry[0]);
    const failed = checks.filter((entry) => !entry[1]).map((entry) => entry[0]);
    setData('landscapeChecks', passed.join('+') || 'none');
    setData('landscapeResult', failed.length === 0 ? 'ok' : 'fail');
    if (failed.length > 0) setData('landscapeFailed', failed.join('+'));

    // 顺带复用 core-shared 的通用统计（「画面上有东西、而且不止一种颜色」）。
    const stats = await verifyOffscreen(device, 128, 72, CLEAR, (pass) => {
      writeUniforms(fixedTime ?? 0);
      drawScene(pass);
    });
    reportVerify('landscape', stats, true);
  }
}

/**
 * 读 `?sun=` / `?water=`：支持弧度或角度（`?sun=30deg`），读不到就返回 null 走默认值。
 */
function readSunOrWater(text: string | null): number | null {
  if (text === null) return null;
  const trimmed = text.trim().toLowerCase();
  const degrees = trimmed.endsWith('deg');
  const value = Number(degrees ? trimmed.slice(0, -3) : trimmed);
  if (!Number.isFinite(value)) return null;
  return degrees ? (value * Math.PI) / 180 : value;
}

/** 夹到 `[min, max]`，`null` 时用 `fallback`。 */
function clampRange(value: number | null, min: number, max: number, fallback: number): number {
  if (value === null) return fallback;
  return Math.min(Math.max(value, min), max);
}

/** 把 `extra.x` 全部改成 `part`，片元据此区分树干（0）与树冠（1）。 */
function withPart(mesh: MeshBuffers, part: number): MeshBuffers {
  const extras = Float32Array.from(mesh.extras);
  for (let index = 0; index < extras.length; index += 2) extras[index] = part;
  return { ...mesh, extras };
}

/**
 * `clip = projection × view × point`（只投影一个点，不值得为此建矩阵）。
 *
 * 下标要小心：两个矩阵都是**列主序**，`m[column * 4 + row]`，所以
 * `result[i] = Σ_j m[j * 4 + i] * v[j]`。这里先把点乘进 view 得到视空间坐标，
 * 再乘 projection —— 「行」的下标是 `row`，不是 `row * 4`（写错的话投影结果会
 * 完全离谱，太阳的屏幕坐标能算出 -1815 这种值）。
 */
function projectPoint(
  out: number[],
  point: ArrayLike<number>,
  view: ArrayLike<number>,
  projection: ArrayLike<number>,
): void {
  const x = point[0]!;
  const y = point[1]!;
  const z = point[2]!;
  const viewX = view[0]! * x + view[4]! * y + view[8]! * z + view[12]!;
  const viewY = view[1]! * x + view[5]! * y + view[9]! * z + view[13]!;
  const viewZ = view[2]! * x + view[6]! * y + view[10]! * z + view[14]!;
  const viewW = view[3]! * x + view[7]! * y + view[11]! * z + view[15]!;
  for (let row = 0; row < 4; row++) {
    out[row] =
      projection[row]! * viewX +
      projection[4 + row]! * viewY +
      projection[8 + row]! * viewZ +
      projection[12 + row]! * viewW;
  }
}

/**
 * 世界坐标 → **屏幕归一化坐标** `[u, v]`（都是 0~1，原点在左上角）。
 *
 * 分区探针要靠它定位：太阳探针打在「主光方向投影出来的位置」，河面探针打在
 * 「河道中心线投影出来的位置」—— 探针于是跟着几何走，而不是手工估一个百分比。
 */
function projectToScreen(
  x: number,
  y: number,
  z: number,
  view: ArrayLike<number>,
  projection: ArrayLike<number>,
): readonly [number, number] {
  const clip = [0, 0, 0, 0];
  projectPoint(clip, [x, y, z], view, projection);
  const w = clip[3]! === 0 ? 1e-6 : clip[3]!;
  return [clip[0]! / w * 0.5 + 0.5, 0.5 - clip[1]! / w * 0.5];
}

/* ------------------------------------------------------------------------------------------------ */
/* 离屏像素读回与分区统计                                                                                */
/* ------------------------------------------------------------------------------------------------ */

/**
 * 把一次绘制画进离屏目标并读回 **RGBA 像素**（不是 core-shared 的摘要统计）。
 *
 * 分区探针需要「同一帧里好几块区域各自的均值 / 最亮像素 / 颜色种类」，所以这里把整幅像素
 * 拿回来自己统计。三个踩过的坑与 `core-shared.verifyOffscreen` 相同：`usage` 要带 `CopySrc`、
 * 深度用 `depth32float`、读回 buffer 用 `MapRead | CopyDst`，另外 WebGPU 要求
 * `bytesPerRow` 是 256 的倍数（读回后再逐行去掉填充）。
 *
 * `rowsBottomUp` 处理的是**两个后端读回行序不同**这件事：WebGPU 的纹理原点在左上，
 * `copyTextureToBuffer` 读回的第 0 行就是屏幕顶端；而 WebGL2 走的是 `gl.readPixels`，
 * 它的原点在**左下**，读回的第 0 行是屏幕底端。分区探针是按屏幕位置定义的，
 * 所以这里统一翻成屏幕行序 —— 这是 GL 与 WebGPU 两套坐标系的固有差别，
 * 与顶点属性、绑定槽位那些无关（真实截图的合成路径永远是从上往下的那一份，
 * `scripts/analyze-screenshot.mjs` 也按那个口径统计）。
 */
async function readOffscreen(
  device: Device,
  width: number,
  height: number,
  clear: readonly [number, number, number, number],
  rowsBottomUp: boolean,
  draw: (pass: RenderPassEncoder) => void,
): Promise<Uint8Array> {
  const bytesPerRow = Math.ceil((width * 4) / 256) * 256;
  const rowBytes = width * 4;
  const byteLength = bytesPerRow * height;
  // 这里用 createTexture + createRenderTarget 的等价写法（core-shared 用的是 RenderTarget）。
  const target = device.createRenderTarget({
    label: 'landscape-verify',
    width,
    height,
    color: 'rgba8unorm',
    depth: 'depth32float',
    usage: TextureUsage.CopySrc,
  });
  const readback = device.createBuffer({
    label: 'landscape-verify-readback',
    size: byteLength,
    usage: BufferUsage.MapRead | BufferUsage.CopyDst,
  });
  const descriptor = target.createPassDescriptor({
    loadOp: 'clear',
    storeOp: 'store',
    clearValue: clear,
    depthLoadOp: 'clear',
    depthClearValue: 1,
  });
  const encoder = device.createCommandEncoder({ label: 'landscape-verify' });
  const pass = encoder.beginRenderPass({
    label: 'landscape-verify-pass',
    colorAttachments: descriptor.colorAttachments,
    depthStencilAttachment: descriptor.depthStencilAttachment,
  });
  draw(pass);
  pass.end();
  const copyEncoder = device.createCommandEncoder({ label: 'landscape-copy' });
  copyEncoder.copyTextureToBuffer(
    { texture: target.colors[0]!, origin: { x: 0, y: 0 } },
    { buffer: readback, offset: 0, bytesPerRow },
    { width, height, depthOrArrayLayers: 1 },
  );
  device.queue.submit([encoder.finish(), copyEncoder.finish()]);

  await readback.mapAsync('read', 0, byteLength);
  const raw = new Uint8Array(readback.getMappedRange(0, byteLength)).slice();
  readback.unmap();
  readback.destroy();
  target.destroy();

  const pixels = new Uint8Array(rowBytes * height);
  for (let row = 0; row < height; row++) {
    // `rowsBottomUp` 时把读回的第 row 行写到目标缓冲的倒数第 row 行（理由见函数说明）。
    const targetRow = rowsBottomUp ? height - 1 - row : row;
    pixels.set(raw.subarray(row * bytesPerRow, row * bytesPerRow + rowBytes), targetRow * rowBytes);
  }
  return pixels;
}

interface Difference {
  /** 整块区域的逐像素「三通道绝对差之和 / 3」的平均值。 */
  readonly mean: number;
  /** 单像素的最大通道差（0~255）。 */
  readonly max: number;
  /** 有变化的像素占比（任一通道差 ≥ 2 即算变化）。 */
  readonly changed: number;
}

/**
 * 两块同尺寸像素的区域差（只统计给定矩形）。
 *
 * 为什么不用 5×5 均值来证明「时间在动」：上一版把两张不同时间的截图各自取探针均值，
 * 结果逐字相同 —— 波纹只改变像素的分布，小块均值完全可以一样。逐像素差则直接量
 * 「这一块里有多少个像素变了、变了多少」，是「动没动」的直接证据。
 * `changed` 是其中最有说服力的那个数：整块河面里应该有相当比例的像素变化，
 * 而一块**不随时间变化**的区域（例如天空）应当接近 0。
 */
function regionDifference(
  left: Uint8Array,
  right: Uint8Array,
  width: number,
  height: number,
  ux0: number,
  ux1: number,
  uy0: number,
  uy1: number,
): Difference {
  const x0 = Math.floor(ux0 * width);
  const x1 = Math.max(x0 + 1, Math.floor(ux1 * width));
  const y0 = Math.max(0, Math.floor(uy0 * height));
  const y1 = Math.min(height, Math.max(y0 + 1, Math.floor(uy1 * height)));
  let total = 0;
  let max = 0;
  let changed = 0;
  let count = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const index = (y * width + x) * 4;
      let sum = 0;
      let pixelMax = 0;
      for (let channel = 0; channel < 3; channel++) {
        const delta = Math.abs(left[index + channel]! - right[index + channel]!);
        if (delta > max) max = delta;
        if (delta > pixelMax) pixelMax = delta;
        sum += delta;
      }
      total += sum / 3;
      if (pixelMax >= 2) changed += 1;
      count += 1;
    }
  }
  return { mean: count === 0 ? 0 : total / count, max, changed: count === 0 ? 0 : changed / count };
}

interface Region {
  readonly mean: readonly [number, number, number];
  readonly distinct: number;
  /** 亮度标准差：越大说明这块区域的颜色越「花」，纯色区域接近 0。 */
  readonly spread: number;
  readonly x: number;
  readonly y: number;
}

/** 统计一块相对区域（`ux/uy` 都是 0..1 的比例）。 */
function regionStats(
  pixels: Uint8Array,
  width: number,
  height: number,
  ux0: number,
  ux1: number,
  uy0: number,
  uy1: number,
): Region {
  const x0 = Math.floor(ux0 * width);
  const x1 = Math.max(x0 + 1, Math.floor(ux1 * width));
  const y0 = Math.floor(uy0 * height);
  const y1 = Math.max(y0 + 1, Math.floor(uy1 * height));
  const colors = new Set<number>();
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumL = 0;
  let sumL2 = 0;
  let count = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const index = (y * width + x) * 4;
      const r = pixels[index]!;
      const g = pixels[index + 1]!;
      const b = pixels[index + 2]!;
      sumR += r;
      sumG += g;
      sumB += b;
      const l = luminance([r, g, b]);
      sumL += l;
      sumL2 += l * l;
      colors.add((r << 16) | (g << 8) | b);
      count += 1;
    }
  }
  const meanL = count === 0 ? 0 : sumL / count;
  const variance = count === 0 ? 0 : Math.max(sumL2 / count - meanL * meanL, 0);
  return {
    mean: [Math.round(sumR / count), Math.round(sumG / count), Math.round(sumB / count)],
    distinct: colors.size,
    spread: Math.sqrt(variance),
    x: Math.floor((x0 + x1) / 2),
    y: Math.floor((y0 + y1) / 2),
  };
}

/**
 * 在给定范围内找**最亮的 5×5 小块的均值**（太阳探针）。
 * 用小块均值而不是单像素，是为了不被一颗孤立的高光噪点骗到。
 */
function brightestRegion(
  pixels: Uint8Array,
  width: number,
  height: number,
  uy0: number,
  uy1: number,
): Region {
  const y0 = Math.floor(uy0 * height);
  const y1 = Math.max(y0 + 1, Math.floor(uy1 * height));
  let bestX = 2;
  let bestY = Math.max(2, y0);
  let best = -1;
  for (let y = Math.max(2, y0); y < Math.min(height - 2, y1); y++) {
    for (let x = 2; x < width - 2; x++) {
      let sum = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const index = ((y + dy) * width + (x + dx)) * 4;
          sum += luminance([pixels[index]!, pixels[index + 1]!, pixels[index + 2]!]);
        }
      }
      if (sum > best) {
        best = sum;
        bestX = x;
        bestY = y;
      }
    }
  }
  return regionAt(pixels, width, height, bestX, bestY);
}

/** 在给定范围内找最暗的 5×5 小块（山脊探针）。 */
function darkestRegion(
  pixels: Uint8Array,
  width: number,
  height: number,
  ux0: number,
  ux1: number,
  uy0: number,
  uy1: number,
): Region {
  const x0 = Math.max(2, Math.floor(ux0 * width));
  const x1 = Math.min(width - 2, Math.floor(ux1 * width));
  const y0 = Math.max(2, Math.floor(uy0 * height));
  const y1 = Math.min(height - 2, Math.floor(uy1 * height));
  let bestX = x0;
  let bestY = y0;
  let best = Number.POSITIVE_INFINITY;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      let sum = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const index = ((y + dy) * width + (x + dx)) * 4;
          sum += luminance([pixels[index]!, pixels[index + 1]!, pixels[index + 2]!]);
        }
      }
      if (sum < best) {
        best = sum;
        bestX = x;
        bestY = y;
      }
    }
  }
  return regionAt(pixels, width, height, bestX, bestY);
}

/** 一块 5×5 小块的统计（中心坐标一起带出来，便于写进 `data-*` 定位）。 */
function regionAt(pixels: Uint8Array, width: number, height: number, centerX: number, centerY: number): Region {
  const colors = new Set<number>();
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumL = 0;
  let count = 0;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = Math.min(Math.max(centerX + dx, 0), width - 1);
      const y = Math.min(Math.max(centerY + dy, 0), height - 1);
      const index = (y * width + x) * 4;
      const r = pixels[index]!;
      const g = pixels[index + 1]!;
      const b = pixels[index + 2]!;
      sumR += r;
      sumG += g;
      sumB += b;
      sumL += luminance([r, g, b]);
      colors.add((r << 16) | (g << 8) | b);
      count += 1;
    }
  }
  return {
    mean: [Math.round(sumR / count), Math.round(sumG / count), Math.round(sumB / count)],
    distinct: colors.size,
    spread: 0,
    x: centerX,
    y: centerY,
  };
}

function meanText(region: Region): string {
  return region.mean.join(',');
}

function luminance(color: readonly [number, number, number]): number {
  return (color[0] + color[1] + color[2]) / 3;
}

main().catch((error: unknown) => {
  setData('landscapeError', (error as Error).message);
  setData('landscapeResult', 'fail');
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = `启动失败：${(error as Error).message}`;
    statusEl.className = 'error';
  }
});
