# LumiaTool

[![CI](https://github.com/Lumiaqian/LumiaTool/actions/workflows/ci.yml/badge.svg)](https://github.com/Lumiaqian/LumiaTool/actions/workflows/ci.yml)

LumiaTool 是一个基于 React 与 Tauri 的跨平台桌面开发工具箱，集中提供编码转换、加解密、数据格式化、文本处理、开发调试和常用生成器。

当前仓库只维护 React + Tauri 桌面端，旧版 Web、浏览器扩展和 uTools 适配器不再参与构建。

## 功能概览

-   编码与转换：Base64、URL、Unicode、ASCII、进制、Hex、序列化、变量命名等。
-   加密与校验：Hash、HMAC、AES、DES、RSA、SM2/SM3/SM4、JWT、Bcrypt、CRC 等。
-   数据与文本：JSON、XML、YAML、TOML、SQL、正则、文本对比、代码格式化等。
-   开发调试：HTTP Snippet、WebSocket、Crontab、IP 计算、时间与时区等。
-   生成与解析：二维码、条形码、UUID、随机字符、Docker Compose 等。

## 数据与网络

工具输入、历史记录和界面设置默认保存在当前设备。大多数工具可以离线运行，以下功能只会在用户主动使用时联网：

-   IP 查询连接 GeoJS。
-   ARM 指令转换连接 armconverter.com。
-   在线代码运行连接 JDoodle，并使用用户自行配置的凭据。
-   WebSocket、HTTP 等调试工具连接用户填写的地址。

应用不包含账户、广告或行为分析 SDK，也不会在后台上传工具输入。

## 下载与安装

桌面端支持 macOS、Windows 和 Linux。发布包将在 [GitHub Releases](https://github.com/Lumiaqian/LumiaTool/releases) 提供。

发布包由 GitHub Actions 在 macOS、Windows 和 Linux 上分别构建。

## 本地开发

开发环境需要 Node.js 22 或更高版本、项目声明的 pnpm 版本、Rust 工具链，以及 Tauri 2 对应平台的系统依赖。

```bash
# 安装依赖
pnpm install

# 启动桌面开发模式
pnpm dev

# TypeScript 与 Rust 检查
pnpm check

# 构建当前平台安装包
pnpm build
```

Tauri 不支持直接跨平台打包，请分别在 macOS、Windows 和 Linux 上执行构建。原始产物位于：

```text
apps/desktop/src-tauri/target/release/bundle/
```

清理依赖、前端产物、Tauri 构建缓存和本地 UI 测试产物：

```bash
pnpm clean
```

## 仓库结构

```text
apps/desktop/       React 界面、工具实现和 Tauri 桌面外壳
packages/config/    工具清单、分类、国际化和生成脚本
scripts/            清理脚本
packaging/aur/      Arch Linux 打包文件
```

根目录 `package.json` 中的版本号是应用版本的主要来源，Tauri 配置会直接读取该版本；发布前还需保持 `apps/desktop/src-tauri/Cargo.toml` 版本一致。

## 开发与反馈

提交改动前至少运行：

```bash
pnpm check
```

问题和功能建议直接提交到 [GitHub Issues](https://github.com/Lumiaqian/LumiaTool/issues)。

## 许可证

[MIT](./LICENSE)
