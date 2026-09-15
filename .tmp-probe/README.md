# 临时探针：`copyBufferSubData` 语义与耗时

这个目录是**临时产物**（`.tmp-*/` 已在 `.gitignore` 里，这里用 `!README.md` 单独放行说明文件），
用来在**真实 WebGL2 上下文**里确认两件单测做不到的事：

1. `gl.copyBufferSubData` 到底存不存在（本仓库 `WebGL2CommandEncoder.ts:99` 附近曾写着
   「WebGL2 没有 copyBufferSubData」，需要用真实上下文证伪）；
2. 一个 buffer 已经按 `COPY_WRITE_BUFFER` 分配过之后，还能不能改绑到 `COPY_READ_BUFFER`
   （这决定了优化 #29 能不能落地，见 `test/webgl2-opt-2a.test.ts` 顶部的说明）。

跑法（端口自己选，别用 5173）：

```powershell
pnpm exec vite --port 5931 --strictPort            # 另开一个终端
node scripts/verify-headless.mjs --chrome "<chrome.exe>" `
  --url "http://localhost:5931/.tmp-probe/gl-probe.html" --wait probeResult --port 5931 `
  -- --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader
```

页面把结论写进 `data-probe-result` / `data-probe-log`，`verify-headless.mjs` 会把它们打印出来。
