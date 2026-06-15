/**
 * extension.ts — Makefile Explorer 插件入口
 *
 * 激活时：
 * 1. 创建 MakefileTreeProvider 并注册到 Explorer 侧边栏
 * 2. 注册 runTarget（执行）、goToDefinition（跳转定义）、refresh（刷新）命令
 * 3. 启动文件监听，Makefile 变化时自动刷新树
 *
 * 交互设计：
 * - 点击 target 节点 → 在终端执行 make <target>
 * - 右键 target → "Go to Definition" → 跳转到 Makefile 中的定义行
 * - 点击 Makefile 文件节点 → 在编辑器中打开 Makefile
 * - 标题栏刷新按钮 → 重新扫描工作区
 *
 * 参数兼容说明：
 * - 从 TreeItem.command 点击触发时，args 为 { name, filePath, line }
 * - 从右键菜单触发时，args 为 MakefileNode 实例（属性 filePath + targetLine）
 * - 两个入口的 handler 会统一处理两种参数格式
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { MakefileTreeProvider } from './MakefileTreeProvider';

/** 用于查找或创建 Make 专用终端 */
const MAKE_TERMINAL_NAME = 'Make';

/**
 * 从不同来源的参数中提取统一字段
 * 兼容 TreeItem.command.arguments 和右键菜单传递的两种格式
 */
function normalizeArgs(args: Record<string, unknown> | undefined): {
  name: string;
  filePath: string;
  line: number;
} | null {
  if (!args) return null;

  // 从 TreeItem.command.arguments 传入（{ name, filePath, line }）
  // 或从右键菜单传入（MakefileNode: { label, filePath, targetLine }）
  const name = (args.name ?? args.label ?? '') as string;
  const filePath = (args.filePath ?? '') as string;
  const line = (args.line ?? args.targetLine ?? -1) as number;

  if (!name || !filePath || line < 0) return null;
  return { name, filePath, line };
}

/**
 * VSCode 扩展激活入口
 * 当用户打开 Makefile Explorer 视图时被调用（activationEvents: onView:makefileExplorer）
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('[Makefile Explorer] 插件已激活');

  // ---- 创建 TreeDataProvider 并注册 TreeView ----
  const provider = new MakefileTreeProvider();

  const treeView = vscode.window.createTreeView('makefileExplorer', {
    treeDataProvider: provider,
    showCollapseAll: true
  });

  // ---- 注册命令 ----

  /**
   * 执行 target：在终端中运行 `make <target>`
   *
   * 执行逻辑（与 vscode-makefile-term 一致）：
   * cd 到 Makefile 所在目录 → make -f <文件名> <target>
   *
   * 参数来源：
   * - 点击 TreeItem：TreeItem.command.arguments → { name, filePath, line }
   */
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'makefile-explorer.runTarget',
      (args: Record<string, unknown> | undefined) => {
        const info = normalizeArgs(args);
        if (!info) {
          vscode.window.showWarningMessage('无法获取 target 信息，请刷新后重试');
          return;
        }

        const makefileDir = path.dirname(info.filePath);
        const fileName = path.basename(info.filePath);

        // 构建 shell 命令：cd 到目录后执行 make
        const command = `cd "${makefileDir}" && make -f ${fileName} ${info.name}`;

        // 查找或创建 Make 专用终端（复用避免产生大量终端标签）
        let terminal = vscode.window.terminals.find(t => t.name === MAKE_TERMINAL_NAME);
        if (!terminal) {
          terminal = vscode.window.createTerminal(MAKE_TERMINAL_NAME);
        }

        terminal.show();
        terminal.sendText(command);

        console.log(`[Makefile Explorer] 执行: ${command}`);
      }
    )
  );

  /**
   * 跳转到 target 定义：在编辑器中打开 Makefile 并定位到对应行
   *
   * 参数来源：
   * - 右键菜单：VSCode 直接传递 MakefileNode 实例 → { filePath, targetLine }
   */
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'makefile-explorer.goToDefinition',
      async (args: Record<string, unknown> | undefined) => {
        const info = normalizeArgs(args);
        if (!info) {
          vscode.window.showWarningMessage('请从 Make Targets 面板右键使用此功能');
          return;
        }

        const uri = vscode.Uri.file(info.filePath);

        try {
          const document = await vscode.workspace.openTextDocument(uri);
          const editor = await vscode.window.showTextDocument(document, {
            viewColumn: vscode.ViewColumn.One,
            preserveFocus: false
          });

          // 将光标定位到 target 定义行
          const position = new vscode.Position(info.line, 0);
          editor.selection = new vscode.Selection(position, position);

          // 将该行滚动到编辑器视口中央
          editor.revealRange(
            new vscode.Range(position, position),
            vscode.TextEditorRevealType.InCenter
          );

          console.log(`[Makefile Explorer] 跳转到: ${info.filePath}:${info.line + 1}`);
        } catch {
          vscode.window.showErrorMessage(`无法打开文件: ${info.filePath}`);
        }
      }
    )
  );

  /**
   * 刷新 Makefile 列表
   */
  context.subscriptions.push(
    vscode.commands.registerCommand('makefile-explorer.refresh', () => {
      provider.refresh();
      console.log('[Makefile Explorer] 手动刷新');
    })
  );

  // ---- 初始扫描 ----
  provider.refresh();

  // ---- 清理 ----
  context.subscriptions.push({
    dispose: () => provider.dispose()
  });
  context.subscriptions.push(treeView);
}

/**
 * 插件停用时调用
 */
export function deactivate(): void {
  console.log('[Makefile Explorer] 插件已停用');
}
