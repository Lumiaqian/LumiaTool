# 参与贡献

感谢你参与 LumiaTool。当前仓库只维护 React + Tauri 桌面端，旧版 Web、浏览器扩展和 uTools 适配器不再接受功能改动。

参与本项目即表示你同意遵守[行为准则](./CODE_OF_CONDUCT.md)。使用与支持方式见[支持说明](./SUPPORT.md)。

## 开发准备

请准备 Node.js 22 或更高版本、项目声明的 pnpm 版本、Rust 工具链，以及 Tauri 2 对应平台的系统依赖。

```bash
pnpm install
pnpm dev
```

## 修改范围

-   工具清单、分类和生成规则位于 `packages/config/src/`。
-   React 页面、组件和工具实现位于 `apps/desktop/src/`。
-   Tauri 配置、Rust 入口和桌面图标位于 `apps/desktop/src-tauri/`。
-   修改工具配置后运行 `pnpm initialize`，不要手工维护 `apps/desktop/src/generated/`。
-   新增工具时同时补齐中文和英文国际化内容。

## 提交前检查

```bash
pnpm check
```

涉及安装包或 Tauri 配置时，还应在当前操作系统执行：

```bash
pnpm build
```

Tauri 安装包不能跨平台生成，其他操作系统的构建结果应在对应系统验证。

## 提交说明

-   一个提交只处理一类问题，避免混入无关格式化或生成产物。
-   不提交 `dist/`、`target/`、`node_modules/`、`.playwright-cli/` 或 `output/`。
-   UI 变更请附修改前后截图，并检查浅色、深色主题及窄窗口布局。
-   修复缺陷时请写清复现步骤、原因和验证结果。

## 版本

应用版本从 `0.0.1` 重新开始。调整版本时同步更新根目录 `package.json` 与 `apps/desktop/src-tauri/Cargo.toml`，并在 `CHANGELOG.md` 记录用户可见变化。
