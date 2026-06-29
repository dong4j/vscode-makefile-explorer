# Changelog

All notable changes to the "vscode-makefile-explorer" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2026-06-29

### Added

- **Run in Background** — right-click a target → "Run in Background" executes the target silently without switching focus or popping up the terminal; status bar still shows running/completed indicators and target badges update as usual
- **Configurable double-click behavior** — new setting `makefile-explorer.defaultRunMode` controls whether double-click runs targets in `foreground` (terminal + focus, default) or `background` (silent, no focus switch); selectable via Settings UI dropdown

## [0.7.0] - 2026-06-25

### Added

- **Run Last Task** — `Alt+Shift+R` (mac `Option+Shift+R`) one-key rerun of the most recent Make target; powered by `context.globalState` so it persists across Dev Host restarts
- **Run with Args...** — right-click a target → "Run with Args..." opens an input box for `KEY=VALUE` pairs (e.g. `VERSION=0.1.0 DEBUG=1`) appended to the `make` command
- **View as List** — toggle button in the view title bar switches between `tree` (Makefile → target → dependency) and `flat` (all targets at the root, label `targetName [path/to/Makefile]`); useful for projects with 20+ targets
- **Target status badges** — target nodes show `$(check)` (green) or `$(error)` (red) after each run; persisted via `context.globalState` and survives Dev Host restarts (FIFO-capped at 50 records)
- **Status bar failure highlight** — failed runs briefly tint the status bar with `statusBarItem.errorBackground`
- **Clear Task Status** — command-palette command to wipe all target status badges (does not affect Run Last Task history)

### Changed

- **Layered architecture** — source reorganized into `models/` (pure data), `providers/` (VSCode adapters), `services/` (business logic), `test/` (mocha specs); enables isolated unit testing of non-UI code
- **Build chain migration: tsc → esbuild** — `npm run compile` now uses esbuild bundling (`esbuild.config.mjs`); full bundle ~25 KB, build time ~5 ms. `compile:tsc` retained as fallback
- **Test framework: mocha + esbuild-runner** — 53 unit tests run directly on TypeScript without pre-compilation; `npm test`
- **Double-click behavior reverted to direct run** — PR5 originally opened an input box on double-click; in v0.7.0 the double-click handler runs the target directly again, and parameter input is moved to the right-click menu

## [0.6.0] - 2026-06-21

### Added

- **Copy Make Command** — right-click on any target and choose "Copy Make Command" to copy a terminal-ready command (`cd "dir" && make -f Makefile <target>`) to the clipboard

## [0.5.0] - 2026-06-18

### Added

- **Running status indicator** — status bar shows `$(sync~spin)` while a Make task runs, `$(check)` on completion (auto-hides after 3s)
- **Target dependency display** — expand a target node to see its dependencies (extracted from `target: dep1 dep2`); dependency nodes are informational leaf items
- **make availability check** — on activation, verifies `make` is in PATH and shows a warning with GNU Make install link if not found
- **Task grouped by Makefile** — in the "Tasks: Run Task" command palette, tasks are now grouped by their source Makefile path (e.g. `docker/Makefile`) instead of a flat list

### Changed

- **Task presentation options** — each task now uses `Dedicated` terminal panel (different targets don't share a terminal), `echo: false` for cleaner output, and `focus: true` to auto-switch focus on execution

## [0.4.0] - 2026-06-17

### Changed

- **Task API execution** — double-click now runs targets via `vscode.tasks.executeTask` instead of raw terminal `sendText`
- **Dedicated terminal per execution** — each double-click creates a fresh `Make - <target>` terminal instead of reusing a single "Make" terminal, preventing commands from being typed into a busy terminal's stdin

### Fixed

- Register `makefile-explorer` `TaskProvider` and `taskDefinitions` so custom task type no longer logs「不存在已注册的任务类型」

## [0.3.0] - 2026-06-16

### Changed

- **Double-click to execute** — targets now require a double-click to run, preventing accidental triggers from single clicks

### Fixed

- Makefile `release` target no longer blocks on VERSION edits (removed overzealous pre-check)

## [0.2.0] - 2026-06-15

### Added

- **Inline "Go to Definition" button** — each target now has a clickable icon to jump directly to its definition line
- **Chinese README** (`README-ZH.md`) with language badge on main README
- **GitHub Actions CI** — compile check on every push and PR
- **GitHub Actions Release** — auto-publish to VSCode Marketplace + GitHub Release on tag push
- **Makefile** with `VERSION` variable — `make release` automates version bump, commit, tag, and push
- **Marketplace publishing guide** (`docs/vscode-marketplace-publishing.md`)
- Extension icon

### Changed

- Right-click menu now only shows "Go to Definition" (inline button replaces the old inline run button)
- Updated `package.json` description, categories, and keywords for Marketplace

## [0.1.0] - 2026-06-15

### Added

- Initial release
- Tree view in Explorer sidebar displaying Makefile targets
- Auto-discovery of Makefiles in workspace (`Makefile`, `makefile`, `GNUmakefile`, `*.mk`, `Makefile.*`)
- One-click target execution in terminal (`cd <dir> && make -f <file> <target>`)
- Right-click "Go to Target Definition" to jump to the exact line in the Makefile
- Description extraction from `##` comments (above-target and inline)
- File watcher for automatic tree refresh on Makefile changes
- Exclusion of common third-party dependency directories (`node_modules`, `vendor`, `.build`, `Pods`, `Carthage`, etc.)
- Smart target filtering (skips `.PHONY`, variable assignments, empty targets)
- Dedicated "Make" terminal (reuses existing terminal to avoid tab spam)

[0.8.0]: https://github.com/dong4j/vscode-makefile-explorer/releases/tag/v0.8.0
[0.7.0]: https://github.com/dong4j/vscode-makefile-explorer/releases/tag/v0.7.0
[0.6.0]: https://github.com/dong4j/vscode-makefile-explorer/releases/tag/v0.6.0
[0.5.0]: https://github.com/dong4j/vscode-makefile-explorer/releases/tag/v0.5.0
[0.4.0]: https://github.com/dong4j/vscode-makefile-explorer/releases/tag/v0.4.0
[0.3.0]: https://github.com/dong4j/vscode-makefile-explorer/releases/tag/v0.3.0
[0.2.0]: https://github.com/dong4j/vscode-makefile-explorer/releases/tag/v0.2.0
[0.1.0]: https://github.com/dong4j/vscode-makefile-explorer/releases/tag/v0.1.0
