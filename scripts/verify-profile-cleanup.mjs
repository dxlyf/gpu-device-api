#!/usr/bin/env node
/**
 * 清扫规则的自检：并发安全 + 陈旧回收。
 *
 * 为什么需要它：`sweepStaleProfiles` 会**删除**临时目录里的东西，判错一条就会误删
 * 另一个正在运行的调用的 Chrome profile。这里的每个用例都对应一条真实约束：
 *
 * - 名字里带「还活着的 pid」→ 必须原样保留（并行运行的另一个调用）。
 * - 名字里带「已经死掉的 pid」→ 立刻回收（被掐断留下来的）。
 * - 没有 pid 的老目录：够旧才回收，太新就留着（无法证明它没在用）。
 * - 不是本工具前缀的目录 → 一个字节都不许碰。
 *
 * 所有目录都建在系统临时目录下的沙盒里（`%TEMP%/gpu-device-api-sweep-test-*`），
 * 跑完自己清掉，不会碰真实的 profile。
 *
 * 用法：node scripts/verify-profile-cleanup.mjs
 * 退出码：0 = 全部用例通过；1 = 有用例失败。
 */

import { mkdirSync, mkdtempSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  PROFILE_PREFIX_HEADLESS,
  PROFILE_PREFIX_SHOT,
  isProcessAlive,
  profileOwnerPid,
  sweepStaleProfiles,
} from './headless-chrome.mjs';

const HOUR = 60 * 60 * 1000;
let failures = 0;

function check(name, ok, detail) {
  if (ok) {
    console.log(`  PASS  ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

/** 取一个「已经确定死掉」的 pid：起一个立刻退出的子进程，拿走它的 pid。 */
function deadPid() {
  const child = spawnSync(process.execPath, ['-e', 'process.exit(0)'], { stdio: 'ignore' });
  if (typeof child.pid !== 'number') throw new Error('[gpu-device-api] verify-profile-cleanup: 拿不到子进程 pid。');
  return child.pid;
}

/** 在沙盒里造一个带内容的假 profile 目录，返回它的名字与占用字节。 */
function makeProfile(dir, name, { bytes = 4096, ageMs = 0 } = {}) {
  const full = join(dir, name);
  mkdirSync(join(full, 'Default'), { recursive: true });
  writeFileSync(join(full, 'Default', 'payload.bin'), Buffer.alloc(bytes, 7));
  if (ageMs > 0) {
    const stamp = new Date(Date.now() - ageMs);
    utimesSync(full, stamp, stamp);
    utimesSync(join(full, 'Default'), stamp, stamp);
  }
  return { name, full, bytes: statSync(join(full, 'Default', 'payload.bin')).size };
}

const sandbox = mkdtempSync(join(tmpdir(), 'gpu-device-api-sweep-test-'));
try {
  const livePid = process.pid; // 本进程自己：一定活着。
  const dead = deadPid();
  const cases = {
    live: makeProfile(sandbox, `${PROFILE_PREFIX_HEADLESS}${livePid}-LiveOwner`),
    dead: makeProfile(sandbox, `${PROFILE_PREFIX_HEADLESS}${dead}-DeadOwner`),
    legacyOld: makeProfile(sandbox, `${PROFILE_PREFIX_SHOT}LegacyOld`, { ageMs: 24 * HOUR }),
    legacyFresh: makeProfile(sandbox, `${PROFILE_PREFIX_SHOT}LegacyFresh`),
    foreign: makeProfile(sandbox, 'not-gpu-device-api-profile'),
  };

  console.log('[verify-profile-cleanup] 前置断言');
  check('活的 pid 判定活着', isProcessAlive(livePid) === true);
  check('死的 pid 判定已死', isProcessAlive(dead) === false, `pid=${dead}`);
  check('老格式名字解析不出 pid', profileOwnerPid(cases.legacyOld.name) === null);
  check('新格式名字解析出 pid', profileOwnerPid(cases.dead.name) === dead);

  const report = sweepStaleProfiles({ dir: sandbox, staleAgeMs: 6 * HOUR });
  const removed = new Set(report.removed.map((entry) => entry.name));
  const keptReasons = new Map(report.kept.map((entry) => [entry.name, entry.reason]));
  const exists = (name) => {
    try {
      statSync(join(sandbox, name));
      return true;
    } catch {
      return false;
    }
  };

  console.log('[verify-profile-cleanup] 清扫结果');
  check('扫描到 4 个本工具目录（外来的不算）', report.scanned === 4, `scanned=${report.scanned}`);
  check('回收了「所有者已死」的目录', removed.has(cases.dead.name));
  check('回收了「够旧的老目录」', removed.has(cases.legacyOld.name));
  check('保留了「所有者还活着」的目录', !removed.has(cases.live.name) && exists(cases.live.name), keptReasons.get(cases.live.name));
  check('保留了「太新且没有 pid」的老目录', !removed.has(cases.legacyFresh.name) && exists(cases.legacyFresh.name), keptReasons.get(cases.legacyFresh.name));
  check('完全没碰不是本工具前缀的目录', exists(cases.foreign.name) && !removed.has(cases.foreign.name));
  check('报告的释放字节数与实际内容一致', report.removedBytes === cases.dead.bytes + cases.legacyOld.bytes, `removedBytes=${report.removedBytes}`);
  check('被回收的目录确实从磁盘上消失', !exists(cases.dead.name) && !exists(cases.legacyOld.name));

  console.log('[verify-profile-cleanup] 再扫一次应当无事可做');
  const second = sweepStaleProfiles({ dir: sandbox, staleAgeMs: 6 * HOUR });
  check('第二次清扫回收 0 个', second.removed.length === 0, `removed=${second.removed.length}`);
  check('第二次清扫仍不碰外来目录与活目录', exists(cases.foreign.name) && exists(cases.live.name));
} finally {
  rmSync(sandbox, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

if (failures > 0) {
  console.error(`[gpu-device-api] verify-profile-cleanup: ${failures} 个用例失败 —— 清扫规则不安全，先别上线。`);
  process.exit(1);
}
console.log('[verify-profile-cleanup] 全部用例通过：活进程的 profile 不被误删，陈旧目录能被回收。');
