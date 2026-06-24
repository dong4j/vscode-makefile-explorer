/**
 * services/TaskHistoryService.ts — 持久化最近一次跑的 Make target
 *
 * 设计动机（PR4 Run Last Task）：
 * - 双击 target 执行后，用户经常想"再跑一次刚才那个"
 * - 不希望每次都重新选 target（即使任务面板里有，也要找）
 * - 提供 Alt+Shift+R（mac Option+Shift+R / Win Alt+Shift+R）一键重跑
 *
 * 存储选型：
 * - 用 context.globalState 而非 context.workspaceState：
 *   - globalState 跨 workspace 共享（用户切到其他项目也能重跑上次的 target）
 *   - workspaceState 绑死在当前 workspace，切走就没了
 * - 不用 memento.files / memento.workspace 之类的旧 API
 * - 不引入 SQLite / 文件系统，纯 VSCode 原生 storage
 *
 * 数据模型：
 * - LastTaskRecord：name + filePath + timestamp
 * - timestamp 用于未来可能加的 "清除超过 N 天的记录" 逻辑（PR4 暂不用）
 *
 * 持久化时机：
 * - extension.ts 的 onDidEndTask 监听器在 task.type === makefile-explorer 时调用 record()
 * - 不在 executeTarget 内部 record（executeTarget 是 async，不能保证一定成功）
 * - 监听 task 结束事件更准确（成功失败都记，失败时也方便一键重试）
 */

import * as vscode from 'vscode';

/**
 * 一次 Make target 调用的历史记录
 */
export interface LastTaskRecord {
  /** target 名，如 build / test */
  name: string;
  /** Makefile 绝对路径，用于重新构造 ShellExecution */
  filePath: string;
  /** 记录时间戳（ms），便于未来做 TTL 清理 */
  timestamp: number;
}

/** globalState 存储 key（所有 workspace 共享） */
const STORAGE_KEY = 'makefileExplorer.lastTask';

/**
 * Task History 持久化服务
 *
 * 用法：
 *   const history = new TaskHistoryService(context);
 *   history.record('build', '/path/to/Makefile');
 *   const last = history.getLast();
 *   if (last) { /* 重跑逻辑 *\/ }
 *
 * 关键约束：
 * - globalState 的 update 是异步的，但 VSCode 实现是同步内存写入 + 异步持久化
 *   短间隔连续 record() 会保留最后一次的值
 * - record() 不抛错，update 失败时 VSCode 内部吞掉
 */
export class TaskHistoryService {

  /**
   * @param context VSCode 扩展上下文，提供 globalState 存储能力
   */
  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * 记录最近一次跑的 target
   *
   * 调用时机：onDidEndTask 监听器中（task 结束时无论成功失败都记）
   *
   * @param name target 名
   * @param filePath Makefile 绝对路径
   */
  record(name: string, filePath: string): void {
    const record: LastTaskRecord = {
      name,
      filePath,
      timestamp: Date.now()
    };
    this.context.globalState.update(STORAGE_KEY, record);
  }

  /**
   * 获取最近一次的 target 记录
   *
   * @returns 记录对象；无历史时返回 undefined
   */
  getLast(): LastTaskRecord | undefined {
    return this.context.globalState.get<LastTaskRecord>(STORAGE_KEY);
  }

  /**
   * 清除历史（用于测试 / 用户主动重置）
   *
   * 当前 PR4 不暴露 reset 命令，但保留 API 供未来用
   */
  clear(): void {
    this.context.globalState.update(STORAGE_KEY, undefined);
  }
}