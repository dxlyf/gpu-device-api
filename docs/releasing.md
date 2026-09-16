# 发布与版本流程

这份文档把「怎么发一个版本」写下来，目标是**别人照着也能做**。此前流程散落在提交信息与代理汇报里，
只有参与者知道；本文件与 `.github/workflows/ci.yml` 一起，构成「回归有自动防线、发布可复现」的最低要求。

对象：`@dxyl/gpu-device-api`（仓库 `github.com/dxlyf/gpu-device-api`，默认分支 `master`）。

> **前提**：本仓库**跟踪 `dist/`**（维护者的决定，见第六节）。因此「改了 `src/` 就必须重建并提交 `dist/`」
> 不是可选项，而是发布前的硬性步骤 —— CI 也会拦这一条。

---

## 一、发版前检查清单

按顺序做完，任何一条不过就先别发。

1. **工作区干净、与远端同步**：`git status` 无输出；`git rev-parse HEAD` 与 `git rev-parse origin/master` 相同。
2. **锁文件一致**：`pnpm install --frozen-lockfile` 通过（`pnpm-lock.yaml` 与 `package.json` 不匹配时会直接失败）。
3. **类型检查**：`pnpm exec tsc --noEmit` → **0 错误**（strict，且 `noUnusedLocals` / `noUnusedParameters` 开着）。
4. **单元测试**：`pnpm exec vitest run` → **全过**。基线数字会随时间增长（编写本文件时：0.3.0 之后为
   **34 文件 / 515 用例**），判据是「全过，且你新增的用例都在」，不是「数字恰好等于某个值」。
5. **本地跑五条锁定像素基线**（第三节）。⚠️ **这一步 CI 不跑，只能手跑。**
6. **重建并提交 `dist/`**：`pnpm run build`，然后 `git status --porcelain -- dist` 必须为空。
7. **更新 `CHANGELOG.md` 与版本号**（第二节）。
8. **确认将要发布的文件清单**：`npm pack --dry-run` —— 应包含 `dist/**` 与 `CHANGELOG.md`，
   且**不含** `examples/`、`test/`、`scripts/`。

> 第 2 / 3 / 4 / 6 条在 CI 上会自动跑（第七节）。**第 5 条不会** —— 不要因为「CI 绿了」就跳过它。

---

## 二、版本号与 `CHANGELOG.md` 约定

### 版本号怎么选（0.x 阶段）

语义化版本在 `0.x` 下的通行约定：**公开 API 的任何变化都进次版本号**，因为 `0.x` 本来就没有稳定保证。

| 变化类型 | 版本位 | 例 |
| --- | --- | --- |
| 修 bug / 修静默错误 / 性能优化 / 内部重构（不动公开面） | patch（`0.3.0` → `0.3.1`） | |
| 新增公开 API，或改变已有公开 API 的签名 / 行为 | minor（`0.3.0` → `0.4.0`） | 0.3.0 的 `getMappedRange()` 返回类型由 `ArrayBuffer` 改为 `ArrayBuffer \| Uint8Array` |

`package.json` 的 `version`、`CHANGELOG.md` 的节标题、git tag 三者**必须一致**。

### `CHANGELOG.md` 怎么写

- 每版一节，标题格式 `## [X.Y.Z] - YYYY-MM-DD`（日期用**发布当天**，不是动笔那天）。
- 小节按需选用：`修复（静默错误）` / `新增` / `变更（可能影响使用方）` / `性能` / `移除` / `工程与文档` / `已知未完成`。
- **尽量给实测数字**（修复前 → 修复后），不要只写「实现了」。性能项尤其如此。
- **没有实测证据的必须标注**。先例：0.3.0 明确写了 `toNativeScissorRect` / `toNativeViewportRect`
  的浏览器实测「尚未补做」，并说明页面里的期望值来自规范推导、不是实测。

### tag 的现状（如实说明）

| tag | 本地 | 远端 | 备注 |
| --- | --- | --- | --- |
| `v0.0.4` | 有（annotated，指向 `0236d1f`） | **没有** | 早期遗留；npm 上现有的版本列表从 `0.1.0` 起 |
| `v0.1.0` | 有 | 有 | |
| `v0.1.1` | 有 | 有 | 与 `v0.0.4` **解引用到同一个提交** `0236d1f` —— 早期 tag 不严谨 |
| `v0.2.0` | 有 | 有 | 事后补打的（tagger 日期与 0.3.0 同一天） |
| `v0.3.0` | 有 | 有 | 同上 |

历史不重写，结论只有一条：**从下一个版本起，tag 在发布当时打**，不要再事后补。
一律用 **annotated tag**（`git tag -a`），不要用 lightweight tag —— 现存的 5 个 tag 全是 annotated。

---

## 三、本地跑五条锁定基线（CI 不覆盖，必须手跑）

这些基线是「像素级正确性」的唯一自动判据，目前**只能在本地、用本机安装的 Chrome + SwiftShader 跑**。

### 准备

```powershell
# 终端 1：静态服务器（端口随便选，别用 5173 —— 那是开发时常驻的）
pnpm exec vite --port 5988 --strictPort
```

两个注意点：

- **用 `localhost` 而不是 `127.0.0.1`**：本机 vite 默认只绑 IPv6，用 `127.0.0.1` 连不上。
- **Chrome 路径**：本文示例用 Windows 的 `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`；
  换平台时替换成自己的路径即可（本仓库目前只在 Windows + 本机 Chrome 上实测过这条路径）。

抓取工具是仓库自带的 `scripts/verify-headless.mjs`（CDP 轮询页面写好的 `data-*`，
理由是 `--dump-dom` 会抢在 WebGPU 的真实异步回调之前 dump）。**不要**自己写 `spawn + mkdtemp + rmSync`
去管 Chrome profile —— 那种写法曾在 Windows 上静默泄漏 profile，累积约 34 GB 把 C 盘压到只剩 232 MB。

### 两个后端互斥的启动参数

| 后端 | 参数 |
| --- | --- |
| WebGL2 | `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader` |
| WebGPU | `--enable-unsafe-webgpu` |

**两者不能同时加。** 单条命令的样子：

```powershell
$chrome = 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
node scripts/verify-headless.mjs --chrome $chrome --wait depthResult `
  --url "http://localhost:5988/examples/depth.html?backend=webgl2" `
  --timeout 240000 -- --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader
```

退出码：`0` = 拿到结论且不是 `fail`；`1` = 超时、结论是 `fail`、或页面抛异常。

### 五条锁定基线（两后端各跑一遍）

| 页面（`?backend=` 由下面表格决定） | 等哪个 `data-*` | 期望值 |
| --- | --- | --- |
| `examples/instancing.html?verify=1&spin=0` | WebGL2 等 `instancingPixel`，**WebGPU 等 `instancingLit`** | `instancingPixel=68,30,39`、`instancingDistinct=12` |
| `examples/depth.html?backend=webgl2` / `?backend=webgpu` | `depthResult` | `depthResult=pass`、`depthPixel=255,0,0,255` |
| `examples/index.html?verify=1&spin=0` | `demoPixel` | `demoPixel=46,29,12` |
| `examples/batch.html?verify=1` | `batchLit` | `batchLit=true`、`batchDrawcalls=125` |
| `examples/core-landscape.html` | `landscapeResult` | `landscapeResult=ok`（`landscapeDrawCalls=8`） |

`instancing` / `index` / `batch` / `landscape` 四页由页面自己选后端（不给 `backend` 参数时是 `auto`），
WebGPU 那一遍要确认页面右上角/输出里的实际后端确实是 WebGPU，别把 `auto` 跑成 WebGL2 当成两遍都过了。

另外两条也已锁定，同样两后端：

| 页面 | 等哪个 | 期望 |
| --- | --- | --- |
| `examples/rtt-orientation.html?layer=core`（`layer=gfx` 亦同） | `rttResult` | `rttResult=pass` |
| `examples/stencil.html` | `stencilResult` | `stencilResult=pass` |

### 跑的纪律

- **串行跑**（或最多 2 个并行）。并行跑多个 SwiftShader 无头 Chrome 会互相干扰，典型症状是
  `exitCode 13` / 拿不到 page target。失败了先怀疑并发争用并重试，**不要改测试或改期望值**。
- 判据是**两后端都不 `fail`**，且 WebGPU 的数字与改动前一致。
- 宿主机内存紧张时（本机 15.84 GB，VS Code + Chrome 常占 3~4 GB）浏览器验证可以攒起来批量做；
  确实跑不动就**如实标注「因内存不足未做浏览器验证」**，这比编一个没跑过的结论强得多。

---

## 四、发布

> ⚠️ 下面的命令是给维护者的操作说明。**本文件不授权自动化流程或任何代理执行
> `git push` / `git tag` / `npm publish`。**

```powershell
# 1. 再次确认状态（第一、二节都做完了）
git status                                    # 必须干净
git log --oneline -1

# 2. 打 annotated tag（发布当时打）
git tag -a v0.4.0 -m "0.4.0"

# 3. 推送提交与 tag
git push origin master
git push origin v0.4.0

# 4. 发布到 npm（在仓库根目录）
npm publish
```

要点：

- **`prepublishOnly` 是最后一道保险**：`package.json` 里 `"prepublishOnly": "npm run build"`，
  `npm publish` 会自动先构建，防止把陈旧产物发出去。但**不要**因此省略「先手工重建并提交 `dist/`」——
  仓库跟踪 `dist`，CI 与仓库约定都要求产物入库，`prepublishOnly` 只保证「发出去的那一份是刚构建的」，
  不能保证「仓库里的那一份也是」。
- **`publishConfig`**：`access: public` + `registry: https://registry.npmjs.org/`，所以发布是公开包，
  且不依赖本机 `.npmrc`（`.npmrc` 被 `.gitignore` 忽略，不随仓库分发）。
- 若改用 `pnpm publish`：**先确认它同样触发了 `prepublishOnly`**，否则会绕过上面那道保险。
  当前约定用 `npm publish`。
- 发布需要 npm 凭据。**凭据不进 CI，也不进任何文档或脚本**（`.github/workflows/ci.yml` 不引用任何 secret）。

---

## 五、发布后核对

```powershell
npm view @dxyl/gpu-device-api version          # latest 应等于刚发布的版本
npm view @dxyl/gpu-device-api versions         # 列表里应出现新版本
npm view @dxyl/gpu-device-api dist-tags        # latest 指向新版本

git rev-parse HEAD
git rev-parse origin/master                    # 两者一致
git ls-remote --tags origin | Select-String "<新版本 tag>"   # tag 真的在远端
```

建议顺手确认「发布出来的包确实是刚构建的产物」（可选）：
解包后看 `dist/types/index.d.ts` 第一行是不是 `/// <reference types="@webgpu/types" />`
（`scripts/postbuild.mjs` 补的那一行；`tsc` 会丢弃它，所以这一行缺失意味着 postbuild 没跑）。

发布当版本对应的 tag 状态（截至 0.3.0）：npm 上 `latest = 0.3.0`，版本列表为 `0.1.0 / 0.1.1 / 0.2.0 / 0.3.0`。

---

## 六、`dist/` 是否入库：本仓库的取舍

**本仓库选择跟踪 `dist/`**（维护者的决定）。写在这里，避免下次又出现不一致。

| | 代价 | 收益 |
| --- | --- | --- |
| 跟踪 `dist/` | 每次改 `src/` 都要在发布前重建并提交；合并冲突会发生在产物上 | clone 下来直接可用（`main` / `module` / `types` 都指向 `dist/`），不依赖 npm 拿到产物 |

配套的两条硬规矩：

1. **`dist/` 只能由 `pnpm run build` 生成**，不要手改（手改会在下一次构建时被覆盖，也会让 CI 的
   一致性校验失去意义）。
2. CI 用 `git status --porcelain -- dist` 拦住「`src` 改了但产物没重建」。历史教训：
   `dist` 落后于 `src` 曾导致「仓库里的产物 ≠ npm 上实际发布的包」。

---

## 七、CI 覆盖什么、不覆盖什么

`.github/workflows/ci.yml`，在 `push`、`pull_request` 与手动触发时运行：

| 步骤 | 命令 |
| --- | --- |
| 安装依赖（严格按锁文件） | `pnpm install --frozen-lockfile` |
| 类型检查 | `pnpm exec tsc --noEmit` |
| 单元测试 | `pnpm exec vitest run` |
| 构建产物 | `pnpm run build` |
| `dist` 与 `src` 一致 | `git status --porcelain -- dist` 必须为空 |

Node 24 + pnpm 12.3.4（与 `package.json` 的 `engines.node` 一致）。工作流不申请写权限、不引用任何 secret。

关于 `engines.node: ">=24"`：这是**构建 / 开发工具链**的要求（本仓库只在 Node 24 上验证过）。
发布出去的 `dist/` 是预构建的 ESM，使用方运行它并不需要 Node 24，但 npm 会对低于该范围的 Node
打 `EBADENGINE` 警告。若确有使用方受此困扰，放宽到「实际验证过的更低版本」即可 —— 不要声明没验证过的范围。

**不覆盖：第三节的五条锁定像素基线。** 原因是它们依赖 SwiftShader 参数、本机 Chrome 路径，
以及「两个后端的启动参数不能同时加」这类细节，在 GitHub runner 上的行为未经验证。
放一个不稳定的必过项进去，只会把「红」变成常态、进而掩盖真实回归。
要纳入的正确路径是 Playwright 或官方 Chrome 容器，**先证明环境稳定再进工作流**。

**状态标注**：本工作流**没有在真实 GitHub runner 上运行过**。编写时在本机能做的验证都做了：
actionlint v1.7.12（下载后核对过 sha256）对工作流报 0 问题；`uses:` 的三个 action 的 `with:` 输入名与
`using` 运行时逐个核对过官方 `action.yml`；每条命令都用同一套依赖实跑通过；最后一个步骤的 shell
逻辑在临时 git 仓库里做过行为测试（干净 → 退出码 0；产物被改、产物里多出未跟踪文件 → 退出码 1）。
首次推送后请以 GitHub 上的实际结果为准；若某一步在别人机器上误报，优先把它退化成更弱的检查
（例如把 `dist` 一致性退化成「只检查构建成功」），而不是关掉整个工作流。
