/**
 * 类型定义 — Makefile Explorer 的数据模型
 */

import * as vscode from 'vscode';

/**
 * 表示 Makefile 中的一个可执行 target
 */
export interface Target {
  /** target 名称，如 build / test / clean */
  name: string;
  /** 在 Makefile 中的行号（0-based） */
  line: number;
  /** 从 target 上方注释提取的描述信息 */
  description: string;
  /** 所属 Makefile 文件的绝对路径 */
  filePath: string;
}

/**
 * 树节点的两种类型：
 * - 'makefile': Makefile 文件节点（可展开，包含 targets）
 * - 'target': Makefile 中的可操作命令节点
 */
export type NodeType = 'makefile' | 'target';

/**
 * 树节点数据结构，TreeDataProvider 使用此类构建树
 */
export class MakefileNode extends vscode.TreeItem {
  /** 节点类型 */
  readonly nodeType: NodeType;
  /** 所属 Makefile 路径（target 节点关联到父文件） */
  readonly filePath: string;
  /** target 在 Makefile 中的行号（仅 target 节点有效） */
  readonly targetLine: number;
  /** 子节点（仅 makefile 节点有效，存储 Target 节点列表） */
  children: MakefileNode[] = [];

  constructor(
    label: string,
    nodeType: NodeType,
    filePath: string,
    targetLine: number = -1,
    collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
  ) {
    super(label, collapsibleState);
    this.nodeType = nodeType;
    this.filePath = filePath;
    this.targetLine = targetLine;

    // 根据节点类型设置不同的图标和交互行为
    if (nodeType === 'makefile') {
      // Makefile 文件节点：使用文件图标，点击可打开文件
      this.resourceUri = vscode.Uri.file(filePath);
      this.iconPath = vscode.ThemeIcon.File;
      this.contextValue = 'makefileFile';
      // 点击文件节点 → 打开 Makefile 文件
      this.command = {
        command: 'vscode.open',
        title: 'Open Makefile',
        arguments: [vscode.Uri.file(filePath)]
      };
    } else {
      // target 节点：点击 → 在终端执行
      this.iconPath = new vscode.ThemeIcon('symbol-method');
      this.contextValue = 'makefileTarget';
      this.tooltip = `${filePath}:${targetLine + 1} — 点击执行，右键跳转到定义`;
      this.command = {
        command: 'makefile-explorer.runTarget',
        title: 'Run Make Target',
        arguments: [{ name: label, filePath, line: targetLine }]
      };
    }
  }
}
