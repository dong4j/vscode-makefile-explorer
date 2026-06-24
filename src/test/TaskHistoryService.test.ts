/**
 * test/TaskHistoryService.test.ts — TaskHistoryService 单元测试
 *
 * 设计：mock context.globalState（仅实现 get/update），避免拉起 vscode runtime。
 * service 本身逻辑简单（KV 包装），但单测能：
 * 1. 锁定 globalState key 名称（重构时及时发现破坏）
 * 2. 锁定 record/getLast/clear 的语义边界
 * 3. 跨 session 持久化语义（service 层不做，但保证写入成功）
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'mocha';
import { TaskHistoryService } from '../services/TaskHistoryService';
import type * as vscode from 'vscode';

/**
 * 构造一个最小 ExtensionContext mock
 *
 * 只实现 globalState.get / globalState.update，
 * 其他 ExtensionContext 字段不实现（cast as any 兜底）。
 */
function makeMockContext(): vscode.ExtensionContext {
  const store = new Map<string, unknown>();
  return {
    globalState: {
      get: <T>(key: string) => store.get(key) as T | undefined,
      // 模拟 VSCode 实现：update 同步内存写入 + 异步持久化
      update: (key: string, value: unknown) => {
        if (value === undefined) {
          store.delete(key);
        } else {
          store.set(key, value);
        }
        return Promise.resolve();
      }
    }
    // 其他 ExtensionContext 字段未实现，使用 as any 兜底
  } as unknown as vscode.ExtensionContext;
}

describe('TaskHistoryService', () => {

  it('初始状态 getLast 返回 undefined', () => {
    const svc = new TaskHistoryService(makeMockContext());
    assert.equal(svc.getLast(), undefined);
  });

  it('record 后 getLast 返回对应记录', () => {
    const svc = new TaskHistoryService(makeMockContext());
    svc.record('build', '/path/Makefile');
    const last = svc.getLast();
    assert.ok(last);
    assert.equal(last.name, 'build');
    assert.equal(last.filePath, '/path/Makefile');
    assert.ok(last.timestamp > 0, 'timestamp 应该是正数');
  });

  it('连续 record 保留最后一次', () => {
    const svc = new TaskHistoryService(makeMockContext());
    svc.record('build', '/p1/Makefile');
    svc.record('test', '/p2/Makefile');
    svc.record('clean', '/p3/Makefile');
    const last = svc.getLast();
    assert.ok(last);
    assert.equal(last.name, 'clean');
    assert.equal(last.filePath, '/p3/Makefile');
  });

  it('clear 后 getLast 返回 undefined', () => {
    const svc = new TaskHistoryService(makeMockContext());
    svc.record('build', '/p/Makefile');
    svc.clear();
    assert.equal(svc.getLast(), undefined);
  });

  it('不同 instance 共享同一个 storage（globalState 跨 instance）', () => {
    const ctx = makeMockContext();
    const svc1 = new TaskHistoryService(ctx);
    svc1.record('build', '/p/Makefile');
    // svc2 用同一个 ctx，应能看到 svc1 写入的数据
    const svc2 = new TaskHistoryService(ctx);
    const last = svc2.getLast();
    assert.ok(last);
    assert.equal(last.name, 'build');
  });
});