/**
 * esbuild.config.mjs — Makefile Explorer 构建脚本（PR2 替换 tsc）
 *
 * 为什么要迁到 esbuild：
 * - tsc 输出 N 个 .js（每个 .ts 一份），加载时跨文件 require
 * - esbuild 输出单文件 bundle，out/extension.js 自包含，加载更快
 * - watch 模式增量编译比 tsc 快一个数量级（开发体验改善）
 *
 * 与 tsc 的兼容性设计（PR2 选 B 方案：替换 + 保留兜底）：
 * - tsconfig.json 保留不动（IDE / eslint 仍依赖它做类型检查）
 * - package.json scripts 切换：
 *     compile       → 走 esbuild（默认）
 *     compile:tsc   → 走 tsc（兜底，PR2 出问题可一键回滚）
 *     watch         → 走 esbuild --watch
 *
 * 关键配置说明：
 * - external: ['vscode'] —— vscode 模块由 VSCode 运行时注入，不能 bundle 进去
 * - platform: 'node'    —— Node.js CommonJS 环境（VSCode 扩展默认）
 * - target: 'node18'    —— VSCode 1.85+ 最低 Node 18
 * - format: 'cjs'       —— CommonJS，VSCode 扩展要求
 * - sourcemap: true     —— 输出 .map 文件，VSCode 调试栈可定位回 .ts 源
 *
 * 不要做的事：
 * - 不要开启 minify —— 开发期可读性 > 体积，vsce package 时会再压缩
 * - 不要把 'vscode' 从 external 移除 —— VSCode 注入的模块不能 bundle
 */

import { build, context } from 'esbuild';
import { rm } from 'fs/promises';

const isWatch = process.argv.includes('--watch');

/**
 * 共享构建配置
 *
 * 暴露为顶层 const 是为了让 watch 模式复用同一份配置；
 * 改 build options 时只需改这一处。
 */
const buildOptions = {
  entryPoints: ['src/extension.ts'],
  outfile: 'out/extension.js',
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: ['vscode'],
  sourcemap: true,
  // minify 保留默认 false —— 开发期可读性优先
  logLevel: 'info'
};

if (isWatch) {
  // watch 模式：起 context，增量重编译
  const ctx = await context(buildOptions);
  await ctx.watch();
  console.log('[esbuild] watching for changes... (Ctrl+C to stop)');
} else {
  // 单次构建：先清空 out/ 目录，避免 tsc 旧产物（多文件拆分）与 esbuild bundle（单文件）
  // 在同一目录共存造成 working tree 不干净。force: true 容忍目录不存在。
  await rm('out', { recursive: true, force: true });

  const result = await build(buildOptions);
  if (result.errors.length > 0) {
    process.exit(1);
  }
  console.log('[esbuild] build complete → out/extension.js');
}