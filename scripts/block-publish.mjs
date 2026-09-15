/**
 * 发布拦截（由会话助理按用户指示安装）。
 *
 * 用户明确要求：**在他亲口说可以推之前，不要推 npm、不要推 GitHub**。
 * 这个脚本挂在 `package.json` 的 `prepublishOnly` 上，`npm publish` / `pnpm publish`
 * 在真正上传之前会先执行它并因非零退出码而中止。
 *
 * 恢复发布能力的两步（用户授权后）：
 *   1. 删除 `package.json` 里的 `"private": true` 与 `"scripts".prepublishOnly` 两项；
 *   2. 确认 `~/.npmrc` 里有有效的 registry token（若已按建议轮换过，需要重新配置）。
 *
 * GitHub 侧的推送拦截在 `.git/hooks/pre-push` 与 `origin` 的 push URL（见仓库说明）。
 */

console.error(
  [
    '',
    '====================================================================',
    ' 发布已被拦截：用户要求「先不要推，我叫你推再推」。',
    '',
    ' 如果你认为应当恢复发布，请先向用户确认，然后：',
    '   1) 删除 package.json 里的 "private": true',
    '   2) 删除 package.json 里 scripts.prepublishOnly 这一项',
    '   3) 确认 ~/.npmrc 的 registry token 有效',
    '====================================================================',
    '',
  ].join('\n'),
);
process.exit(1);
