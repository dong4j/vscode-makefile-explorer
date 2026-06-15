# Changelog

All notable changes to the "makefile-explorer" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0]: https://github.com/dong4j/makefile-explorer/releases/tag/v0.1.0
