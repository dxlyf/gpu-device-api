#!/usr/bin/env node
/**
 * 无头 Chrome 会话的公共部分（`verify-headless.mjs` 与 `capture-screenshot.mjs` 共用）。
 *
 * 这里集中处理三件在这个仓库里踩过坑的事：
 *
 * 1. 临时 profile 的创建与**回收**。Chrome 的 `--user-data-dir` 建在系统临时目录下，
 *    只靠「正常退出路径上删一次」是不够的：调用方提前掐断进程（管道截断 / Ctrl-C /
 *    超时被 kill）时那段代码根本不会执行；就算执行了，Chrome 刚被 kill、文件句柄还没释放，
 *    Windows 上一次 `rmSync` 也会半途失败并留下目录（实测：正常退出的运行同样会漏）。
 *    历史事故：`%TEMP%` 下堆了 488 个这样的目录、约 34GB，把系统盘挤到只剩 232MB，
 *    连 `node` 都起不来。所以这里做到：所有退出路径（正常 / exit / 信号 / 未捕获异常）
 *    都回收，并且进程启动时先清扫陈旧的残留。
 *
 * 2. 并发安全。profile 目录名里带着创建者的 pid（`<前缀><pid>-<随机串>`），清扫时
 *    只回收「所有者进程已经死了」的目录；pid 还活着说明另一个调用正在跑，一律不碰。
 *    名字里没有 pid 的目录只可能是本修复之前留下的老目录，退回到「上次修改早于 N 小时」
 *    才回收，因此也不会误删并行运行的调用。
 *
 * 3. page target 的有界重试。一连串 WebGL2(swiftshader) 运行之后紧接着起 WebGPU 的 Chrome，
 *    调试端口会起来、但迟迟不暴露 page target（疑似上一个 Chrome 的 GPU 进程还在回收），
 *    旧实现等满 30s 就直接失败。现在改成：按窗口退避重试（换新 profile、重拉进程），
 *    总时长仍受 `--timeout` 约束；重试耗尽后照旧抛出原始失败信息，不把真失败伪装成慢启动。
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** 本工具在系统临时目录里使用的两个 profile 前缀。清扫只认这两个前缀，别的一律不碰。 */
export const PROFILE_PREFIX_HEADLESS = 'gpu-device-api-headless-';
export const PROFILE_PREFIX_SHOT = 'gpu-device-api-shot-';

const OWN_PROFILE_PREFIXES = [PROFILE_PREFIX_HEADLESS, PROFILE_PREFIX_SHOT];

/** 目录名里没有 pid（本修复之前创建的老目录）时的陈旧判定阈值：默认 6 小时。 */
export const DEFAULT_STALE_AGE_MS = 6 * 60 * 60 * 1000;

/** 单次尝试等 page target 的窗口：第 1 次 10s，之后逐次翻倍，最多 30s。 */
const TARGET_WINDOW_BASE_MS = 10000;
const TARGET_WINDOW_MAX_MS = 30000;

/** 重试之间的退避：2s 起，逐次翻倍，最多 8s。 */
const RETRY_BACKOFF_BASE_MS = 2000;
const RETRY_BACKOFF_MAX_MS = 8000;

/** 等待 page target 的总预算：至少 30s（与旧实现一致），最多 120s，且不超过 `--timeout`。 */
const TARGET_BUDGET_MIN_MS = 30000;
const TARGET_BUDGET_MAX_MS = 120000;

/** 尝试次数上限。真正兜底的是总预算，这里只是防止极端情况下的忙循环。 */
const MAX_ATTEMPTS = 6;

/** 正常退出时先等 Chrome 自己退出（最多这么久），再删 profile —— 否则 Windows 上多半删不掉。 */
const CHILD_EXIT_WAIT_MS = 5000;

/**
 * 同步收尾时等 Chrome 退出的上限。
 *
 * `process.on('exit')` 里没有事件循环，子进程的 `exit` 事件不会派发，只能自己轮询 pid。
 * 实测：kill 之后立刻删，Windows 上必报 EPERM（Chrome 还没放开文件句柄），
 * 而轮询到进程真的消失之后再删就干净了。
 */
const SYNC_EXIT_WAIT_MS = 2000;

/** 收尾兜底：清理最多花这么久，超时也要让进程退出。 */
const SHUTDOWN_HARD_TIMEOUT_MS = 8000;

/** 轮询调试端口的间隔。 */
const POLL_INTERVAL_MS = 200;

/** spawn 失败里这些错误码重试没有意义：命令行本身就是错的。 */
const FATAL_SPAWN_CODES = ['ENOENT', 'EACCES', 'EPERM', 'EISDIR', 'ENOTDIR', 'EINVAL'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 同步睡眠：只在 `process.on('exit')` 这类没有事件循环的地方用。 */
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** 名字是不是本工具自己的 profile 目录（前缀白名单）。 */
export function isOwnProfileName(name) {
  return OWN_PROFILE_PREFIXES.some((prefix) => name.startsWith(prefix));
}

/**
 * 从目录名里解析创建者的 pid。
 *
 * 返回 `null` 有两种情况：不是本工具的目录，或者是本修复之前留下的、名字里没有 pid 的老目录。
 * 调用方先用 `isOwnProfileName` 把「不是自己的」滤掉，再靠这里的 `null` 走时间兜底。
 */
export function profileOwnerPid(name) {
  for (const prefix of OWN_PROFILE_PREFIXES) {
    if (!name.startsWith(prefix)) continue;
    const match = /^(\d+)-/.exec(name.slice(prefix.length));
    return match ? Number(match[1]) : null;
  }
  return null;
}

/**
 * pid 对应的进程是否还活着。
 *
 * `EPERM` 也算活着：进程存在但当前用户没权限给它发信号。宁可少删一个目录，
 * 也不能删掉另一个正在运行的调用的 profile。
 */
export function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === 'EPERM';
  }
}

/** 递归统计目录体积，只用于报告「释放了多少空间」；统计失败不影响删除。 */
function directorySize(root) {
  let total = 0;
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue; // 权限或竞态：跳过这一层。
    }
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else {
        try {
          total += statSync(full).size;
        } catch {
          // 文件刚好被别处删掉：忽略。
        }
      }
    }
  }
  return total;
}

/**
 * 删除一个 profile 目录（同步，exit 处理器里只能用同步 API）。
 *
 * `maxRetries` 是给 Windows 准备的：Chrome 刚退出时句柄可能还没释放，
 * 第一次 `rmSync` 常常报 EBUSY / EPERM，重试几次就好了。
 */
export function removeProfileDir(dir) {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 });
    return { removed: true, code: null };
  } catch (error) {
    return { removed: false, code: error?.code ?? 'UNKNOWN' };
  }
}

/** 同步等一个 pid 消失（用于没有事件循环的收尾路径）。 */
function waitForChildExitSync(pid, timeoutMs = SYNC_EXIT_WAIT_MS) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (!isProcessAlive(pid)) return true;
    if (Date.now() >= deadline) return false;
    sleepSync(50);
  }
}

/** 建一个带 pid 的 profile 目录。前缀必须是本工具登记过的两个之一。 */
export function createProfileDir(prefix) {
  if (!OWN_PROFILE_PREFIXES.includes(prefix)) {
    throw new Error(`[gpu-device-api] headless-chrome: unknown profile prefix "${String(prefix)}".`);
  }
  return mkdtempSync(join(tmpdir(), `${prefix}${process.pid}-`));
}

/**
 * 启动时清扫系统临时目录下陈旧的 profile 目录。
 *
 * 判定规则（两条，都不涉及目录内容）：
 * - 名字里有 pid → 只删「所有者进程已经不在了」的目录；pid 活着说明有并行调用在用，跳过。
 * - 名字里没有 pid（老目录）→ 只删「上次修改早于 staleAgeMs」的目录，避免误删并行调用。
 *
 * 完全同步执行：调用方在脚本一开头调用它，此时还没有异步任务。
 * `dir` 只为自检脚本准备（默认就是系统临时目录），正常运行不需要传。
 */
export function sweepStaleProfiles({ dir = tmpdir(), staleAgeMs = DEFAULT_STALE_AGE_MS, now = Date.now() } = {}) {
  const report = { dir, scanned: 0, removed: [], kept: [], removedBytes: 0 };
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return report; // 临时目录读不了就什么都不做。
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || !isOwnProfileName(entry.name)) continue;
    report.scanned += 1;
    const full = join(dir, entry.name);
    const ownerPid = profileOwnerPid(entry.name);
    let info;
    try {
      info = statSync(full);
    } catch {
      continue; // 刚好被别人删掉了。
    }
    if (ownerPid !== null && isProcessAlive(ownerPid)) {
      report.kept.push({ name: entry.name, reason: `owner-pid-${ownerPid}-alive` });
      continue;
    }
    if (ownerPid === null && now - info.mtimeMs < staleAgeMs) {
      report.kept.push({ name: entry.name, reason: 'too-recent' });
      continue;
    }
    const bytes = directorySize(full);
    const outcome = removeProfileDir(full);
    if (outcome.removed) {
      report.removed.push({ name: entry.name, bytes });
      report.removedBytes += bytes;
    } else {
      // 只有一种现实可能：另一个（已死的）进程留下的 Chrome 还占着文件。
      // 如实记下来，留给下一次启动再试，绝不假装删干净了。
      report.kept.push({ name: entry.name, reason: `remove-failed-${outcome.code}` });
    }
  }
  return report;
}

/** 把一个清扫报告排版成一行可读日志（调用方决定写到哪个流）。 */
export function formatSweepReport(report) {
  return (
    `扫描 ${report.scanned} 个本工具 profile 目录，回收 ${report.removed.length} 个` +
    `（释放 ${(report.removedBytes / 1048576).toFixed(1)} MB），跳过 ${report.kept.length} 个`
  );
}

/** 把一条「跳过」记录写成给人看的一行（调用方决定写到哪个流）。 */
export function describeKeptProfile(kept) {
  if (kept.reason === 'too-recent') return `${kept.name}：老目录（名字里没有 pid）还不够旧，先不动它`;
  if (kept.reason.startsWith('owner-pid-')) return `${kept.name}：创建者进程仍在运行，跳过`;
  if (kept.reason.startsWith('remove-failed-')) {
    return `${kept.name}：仍被占用（${kept.reason.slice('remove-failed-'.length)}），留给下次启动再试`;
  }
  return `${kept.name}：${kept.reason}`;
}

/** 值得打进日志的「跳过」记录：并行运行的目录、删不掉的目录。太新的老目录不必刷屏。 */
export function noteworthyKeptProfiles(report) {
  return report.kept.filter((kept) => kept.reason !== 'too-recent');
}

/** 等子进程退出；超时就强杀。返回是否确实退出了。 */
async function killChild(child, waitMs = CHILD_EXIT_WAIT_MS) {
  if (!child) return true;
  if (child.exitCode !== null || child.signalCode !== null) return true;
  const exited = new Promise((resolve) => child.once('exit', () => resolve(true)));
  try {
    child.kill();
  } catch {
    // 进程可能已经没了。
  }
  const graceful = await Promise.race([exited, sleep(waitMs).then(() => false)]);
  if (graceful) return true;
  try {
    child.kill('SIGKILL');
  } catch {
    // 同上。
  }
  return Boolean(await Promise.race([exited, sleep(1000).then(() => false)]));
}

/** 单次尝试里等 page target：在 `windowMs` 内轮询调试端口，返回结果与失败细节。 */
async function waitForPageTarget({ childInfo, port, windowMs }) {
  const deadline = Date.now() + windowMs;
  let portAnswered = false;
  let targetsSeen = 0;
  let lastError = null;
  while (Date.now() < deadline) {
    if (childInfo.spawnError) {
      return { target: null, summary: { reason: 'spawn-failed', portAnswered, targetsSeen, lastError: String(childInfo.spawnError.message ?? childInfo.spawnError), spawnCode: childInfo.spawnError.code ?? null } };
    }
    if (childInfo.exited) {
      return { target: null, summary: { reason: 'child-exited', portAnswered, targetsSeen, lastError, exitCode: childInfo.exitCode, spawnCode: null } };
    }
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      portAnswered = true;
      if (Array.isArray(targets)) {
        targetsSeen = targets.length;
        const page = targets.find((entry) => entry.type === 'page' && entry.webSocketDebuggerUrl);
        if (page) return { target: page, summary: { reason: 'ok', portAnswered, targetsSeen, lastError: null } };
      }
    } catch (error) {
      lastError = String(error?.message ?? error);
    }
    await sleep(POLL_INTERVAL_MS);
  }
  return {
    target: null,
    summary: {
      reason: portAnswered ? 'no-page-target' : 'port-unreachable',
      portAnswered,
      targetsSeen,
      lastError,
      spawnCode: null,
    },
  };
}

/** 把一次尝试的失败细节写成中文短语，用于日志与最终错误。 */
function describeAttempt(summary) {
  const parts = [];
  if (summary.reason === 'spawn-failed') {
    parts.push(`Chrome 起不来（${summary.lastError}）`);
  } else if (summary.reason === 'child-exited') {
    parts.push(`Chrome 进程提前退出（exitCode=${summary.exitCode}）`);
  } else if (summary.reason === 'port-unreachable') {
    parts.push(`调试端口 ${summary.lastError ?? '不可达'}`);
  } else if (summary.reason === 'no-page-target') {
    parts.push(`调试端口有响应但没暴露 page target（targets=${summary.targetsSeen}）`);
  } else {
    parts.push(`窗口内没等到 page target（last error: ${summary.lastError ?? '无'}）`);
  }
  return parts.join('，');
}

/**
 * 起一个无头 Chrome 会话，负责 profile 的创建、回收与 page target 的有界重试。
 *
 * 调用方传进来的 `args` 是不含 `--user-data-dir` 与 url 的固定启动参数（两个脚本的
 * 基础参数略有不同），`flags` 是命令行末尾 `--` 之后用户给的原样参数。
 */
export function createHeadlessSession({
  label,
  chrome,
  args = [],
  flags = [],
  url,
  port,
  profilePrefix,
  profileDir: userProfileDir = null,
  timeoutMs,
  log = () => {},
}) {
  const state = {
    child: null,
    childInfo: null,
    profileDir: userProfileDir,
    ownsProfile: userProfileDir === null,
    closed: false,
  };

  function releaseOwnProfile() {
    if (!state.ownsProfile || !state.profileDir) return { removed: false, code: null };
    const dir = state.profileDir;
    state.profileDir = null;
    const outcome = removeProfileDir(dir);
    if (!outcome.removed) {
      // 如实说：没删掉，但下次启动的清扫会按「所有者已死」把它收走。
      log(`${label} 临时 profile 未能删除（${outcome.code}），留给下次启动清扫：${dir}`);
    }
    return outcome;
  }

  /** 同步收尾：只能用在 `process.on('exit')` 里（那里没有事件循环，异步 API 不会跑完）。 */
  function stopSync() {
    if (state.closed) return;
    state.closed = true;
    const child = state.child;
    const pid = child?.pid;
    state.child = null;
    state.childInfo = null;
    try {
      child?.kill();
    } catch {
      // 进程可能已经没了。
    }
    // kill 只是「请求结束」：不等它真的消失就删，Windows 上会 EPERM。
    if (typeof pid === 'number') waitForChildExitSync(pid);
    releaseOwnProfile();
  }

  /** 异步收尾（正常路径用）：先等 Chrome 退出再删，Windows 上这样才删得掉。 */
  async function stop() {
    if (state.closed) return { removed: false, code: null };
    state.closed = true;
    const child = state.child;
    const info = state.childInfo;
    state.child = null;
    state.childInfo = null;
    if (info && !info.exited && child) await killChild(child);
    return releaseOwnProfile();
  }

  async function start() {
    const declared = Number.isFinite(timeoutMs) ? Number(timeoutMs) : 0;
    const budgetMs = Math.min(Math.max(TARGET_BUDGET_MIN_MS, declared), TARGET_BUDGET_MAX_MS);
    const deadline = Date.now() + budgetMs;
    const startedAt = Date.now();
    const attempts = [];

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      if (state.closed) throw new Error(`${label} 会话已关闭，无法继续获取 page target。`);
      const remaining = deadline - Date.now();
      if (remaining <= 1000) break;
      const windowMs = Math.min(TARGET_WINDOW_BASE_MS * 2 ** (attempt - 1), TARGET_WINDOW_MAX_MS, remaining);

      // 每次尝试都用全新的 profile：上一次尝试的 Chrome 可能还占着文件，复用它只会更糟。
      const dir = userProfileDir ?? createProfileDir(profilePrefix);
      state.profileDir = dir;
      const child = spawn(chrome, [...args, `--user-data-dir=${dir}`, ...flags, url], { stdio: 'ignore' });
      const info = { exited: false, exitCode: null, spawnError: null };
      child.once('exit', (code) => {
        info.exited = true;
        info.exitCode = code;
      });
      child.once('error', (error) => {
        info.spawnError = error;
        info.exited = true;
      });
      state.child = child;
      state.childInfo = info;

      const outcome = await waitForPageTarget({ childInfo: info, port, windowMs });
      if (outcome.target) {
        if (attempt > 1) {
          log(`${label} 第 ${attempt} 次尝试拿到了 page target（累计 ${Date.now() - startedAt}ms）。`);
        }
        return outcome.target;
      }

      attempts.push({ attempt, windowMs, summary: outcome.summary });
      const fatal = outcome.summary.reason === 'spawn-failed' && FATAL_SPAWN_CODES.includes(outcome.summary.spawnCode);
      // 这一轮的 Chrome 与 profile 先收掉，别把残骸留在磁盘上。
      state.child = null;
      state.childInfo = null;
      await killChild(child);
      const cleared = releaseOwnProfile();

      if (fatal) {
        throw new Error(
          `${label} Chrome did not expose a page target. 启动失败且重试无意义` +
            `（第 ${attempt} 次：${describeAttempt(outcome.summary)}）。原始信息：${outcome.summary.lastError}`,
        );
      }

      const backoff = Math.min(RETRY_BACKOFF_BASE_MS * 2 ** (attempt - 1), RETRY_BACKOFF_MAX_MS);
      if (deadline - Date.now() <= backoff + 1000 || attempt === MAX_ATTEMPTS) break;
      log(
        `${label} 第 ${attempt} 次尝试没拿到 page target（${describeAttempt(outcome.summary)}），` +
          `${backoff}ms 后重试第 ${attempt + 1} 次${cleared.removed ? '' : '（本轮 profile 未删净，下次启动清扫会收走）'}。`,
      );
      await sleep(backoff);
    }

    const detail = attempts.map((entry) => `第 ${entry.attempt} 次/窗口 ${entry.windowMs}ms：${describeAttempt(entry.summary)}`).join('；');
    throw new Error(
      `${label} Chrome did not expose a page target. 已在 ${budgetMs}ms 预算内重试 ${attempts.length} 次仍失败。` +
        `逐次原始信息 —— ${detail}`,
    );
  }

  return {
    start,
    stop,
    stopSync,
    get profileDir() {
      return state.profileDir;
    },
    get child() {
      return state.child;
    },
  };
}

/**
 * 给会话挂上所有退出路径的清理。
 *
 * `exit` 处理器里只能同步操作，所以走 `stopSync`；信号与未捕获异常都还在正常的事件循环里，
 * 走**异步**的 `session.stop()`（先等 Chrome 真的退出再删 profile，Windows 上这样才删得掉 ——
 * 实测同步删必报 EPERM），并带一个硬超时兜底，保证进程一定会退出。
 *
 * 未捕获异常 / 未处理的 Promise 拒绝都要先把原始错误原样打印出来，绝不吞掉错误信息。
 */
export function installSessionCleanup(session, { label, log = () => {} }) {
  let exiting = false;

  /** 清理然后退出；清理失败也要退出，并把失败原因打出来。 */
  function cleanupThenExit(code) {
    const guard = setTimeout(() => process.exit(code), SHUTDOWN_HARD_TIMEOUT_MS);
    void (async () => {
      try {
        await session.stop();
      } catch (error) {
        console.error(error);
      }
      clearTimeout(guard);
      process.exit(code);
    })();
  }

  process.on('exit', () => {
    session.stopSync();
  });
  const signals = [
    ['SIGINT', 130],
    ['SIGTERM', 143],
    ['SIGHUP', 129],
  ];
  for (const [signal, code] of signals) {
    process.on(signal, () => {
      if (exiting) return;
      exiting = true;
      log(`${label} 收到 ${signal}，回收临时 profile 后退出。`);
      cleanupThenExit(code);
    });
  }
  process.on('uncaughtException', (error) => {
    if (exiting) return;
    exiting = true;
    console.error(error); // 原始错误原样打印。
    cleanupThenExit(1);
  });
  process.on('unhandledRejection', (reason) => {
    if (exiting) return;
    exiting = true;
    console.error(reason instanceof Error ? reason : new Error(String(reason)));
    cleanupThenExit(1);
  });
}
