## Makefile Explorer — 项目自身的 Makefile
##
## 用法：
##   make          # 安装依赖 + 编译
##   make watch    # 监听模式开发
##   make package  # 打包 .vsix
##   make install  # 安装到本地 VSCode
##   make clean    # 清理编译产物
##   make release  # 发布流程引导

.PHONY: all install-deps compile watch package install clean release

# ---- 开发 ----

all: install-deps compile ## 安装依赖 + 编译

install-deps: ## 安装 npm 依赖
	npm install

compile: ## 编译 TypeScript
	npm run compile

watch: ## 监听模式（文件变化自动编译）
	npm run watch

# ---- 打包安装 ----

package: compile ## 打包 .vsix
	@echo "==> 打包 .vsix..."
	npm run package
	@echo ""
	@echo "✅ 打包完成: $$(ls -t *.vsix | head -1)"

install: package ## 打包并安装到本地 VSCode
	@echo "==> 安装到 VSCode..."
	code --install-extension $$(ls -t *.vsix | head -1) --force
	@echo "✅ 安装完成，重启 VSCode 生效"

# ---- 清理 ----

clean: ## 清理编译产物和 .vsix
	rm -rf out/
	rm -f *.vsix
	@echo "✅ 已清理"

# ---- 发布 ----

release: ## 发布流程引导（人工确认后推送 tag）
	@echo "==> 📋 发布前检查清单"
	@echo "  [ ] CHANGELOG.md 已更新版本号"
	@echo "  [ ] package.json version 已更新"
	@echo "  [ ] npm run compile 通过"
	@echo "  [ ] 本地测试无问题"
	@echo ""
	@echo "==> 🚀 确认无误后执行:"
	@echo "  git add . && git commit -m 'chore: bump to v\033[1;33m<version>\033[0m'"
	@echo "  git push origin main"
	@echo "  git tag v\033[1;33m<version>\033[0m"
	@echo "  git push origin v\033[1;33m<version>\033[0m"
	@echo ""
	@echo "  GitHub Actions 自动构建 .vsix 并写入 Release 页面"
