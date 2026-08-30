# 变更记录

本文件记录 LumiaTool 桌面端的用户可见变化。版本从 `0.0.1` 重新开始。

## 0.0.2 - 2026-08-30

### 变更

-   新增 Live Photo 制作、X 媒体解析与下载工具。
-   重构桌面工作台、工具布局、主题样式和应用图标。
-   修复 macOS Release 构建内存不足，支持 Apple Silicon 与 Intel 独立安装包。
-   更新前端与 Rust 依赖并清理已知依赖安全告警。
-   精简个人项目不需要的社区协议、模板和本地发布脚本。

## 0.0.1 - 2026-08-14

### 变更

-   产品更名为 LumiaTool，仓库改为 [Lumiaqian/LumiaTool](https://github.com/Lumiaqian/LumiaTool)。
-   使用 React 19 重构界面与工具页面。
-   使用 Tauri 2 作为唯一桌面运行与打包平台。
-   重新设计桌面布局、主题、组件样式与应用图标。
-   将仓库调整为 `apps/desktop` 与 `packages/config`，前端与 Tauri 合入同一应用包。
-   移除旧版 Web、Chrome、Edge、Firefox 和 uTools 适配构建。
