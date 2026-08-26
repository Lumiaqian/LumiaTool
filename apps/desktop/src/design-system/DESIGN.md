# Lumia Design System

Lumia Design System 是 LumiaTool 桌面开发者工具的唯一视觉与交互契约。

唯一正文：本文件。`designs/lumia-design-system/readme.md` 必须与本文件保持同一内容。生产实现读本文件；设计预览读 DS 目录。

设计和实现必须复用这里的 Token、组件和页面模板。工具不得自行发明布局、颜色、圆角、阴影或操作模式。

## 产品语境

LumiaTool 是本地优先的跨平台开发者工具箱（React + Tauri）。用户目标是快速完成转换、格式化、解析、生成、验证和调试。界面必须像长期使用的桌面生产力软件，不是营销站或 SaaS Dashboard。

来源：

- 生产：`apps/desktop/src/`
- 生产实现目录：`apps/desktop/src/design-system/`
- 品牌母版：`apps/desktop/src-tauri/icons/app-icon-source.svg`
- 可编译设计系统：`designs/lumia-design-system/`
- `designs/lumiatool-ui-exploration/` 全部作废，不得再当契约。

## 主题模型

产品主题是 **真 Light / Dark**。chrome（顶栏、工具架、工具条、状态栏）和 workspace（输入、结果、参数）必须同时换色。

| 设置 | 行为 |
|---|---|
| Light | `document.documentElement.dataset.theme = "light"` |
| Dark | `document.documentElement.dataset.theme = "dark"` |
| Auto | 跟随 `prefers-color-scheme`，写入同一个 `data-theme` |

禁止：

- 深色框架 + 浅色作业面的混合表面。
- 只换 chrome、不换 paper/editor。
- 在组件或 CSS 里硬编码 `rgba(23,20,16)` 一类主题色。
- 第三套 Studio 主题。
- Pico / 旧 `--ctool-*` 蓝灰作为绘制色。

所有可绘制颜色只来自 `--lumia-*`。Light 定义在 `:root, [data-theme="light"]`；Dark 定义在 `[data-theme="dark"]`。绘制属性必须读 token，不得在选择器里再写死 hex。

## 设计原则

1. **任务优先**：输入、结果、关键操作高于装饰。
2. **结构先于容器**：Pane、Toolbar、Rack、Row、Separator。不把每块内容套成独立 Card。
3. **操作就近**：复制、加载、清空、运行靠近对应值。禁止绝对定位覆盖编辑内容。
4. **状态明确**：Empty / Populated / Error / Disabled / Loading 必须可区分。
5. **完整可读**：长值滚动或换行，禁止用 ellipsis 藏核心数据。
6. **本地优先**：状态栏反映真实处理状态，不造仪表盘指标。
7. **同类同构**：新工具必须归入既有模板；不适配先改规范再加模式。
8. **主题完整**：任何表面在 Light 和 Dark 下都必须可读。不得依赖「另一半主题的颜色」。

## 禁止模式

- 渐变背景作页面装饰。品牌 App Icon（Lumia Beam）除外。CSS 假 Beam / glow 不算图标。
- `rounded-xl/2xl`、大面积阴影、浮空 Card 墙。
- 参数、Copy、Select 绝对定位覆盖编辑内容。
- 无标签图标；只靠 Placeholder 表达字段。
- 固定像素平分动态结果高度。
- 工具内任意 Hex / 间距 / 字号 / Radius。
- 空数据时的可执行 Copy / Download。
- 用「路由能打开」代替视觉验收。
- `--lumia-text-light` / `--lumia-text-dark` 这种按主题命名的文本色。只用 `--lumia-text` / `--lumia-muted`。
- 2 字母英文切片当作工具图标规范。那是占位，不是契约。
- 状态栏写死 `READY` / `LOCAL PROCESSING` / `UTF-8`。
- 硬编码 `⌘K`。快捷键按平台显示。

## 视觉基础

### 色彩语义

角色不可互换，Light 和 Dark 共用同一角色、不同色值。

| Token | 角色 |
|---|---|
| `--lumia-app-bg` | 应用框架底 |
| `--lumia-sidebar-bg` | 工具架 |
| `--lumia-raised-bg` | 顶栏、Panel Header、抬起面 |
| `--lumia-overlay-bg` | Dropdown / Dialog / ExtendPage |
| `--lumia-paper` | 结果、文档、普通内容 |
| `--lumia-editor` | 输入、编辑器 |
| `--lumia-controls` | 参数 Rack |
| `--lumia-text` | 主文本 |
| `--lumia-muted` | 次要文本 |
| `--lumia-primary` | 当前区域唯一主操作 |
| `--lumia-on-primary` | 主操作上的字 |
| `--lumia-selection` | 当前位置 / 当前工具 / 导航选中 |
| `--lumia-on-selection` | 选中项上的字 |
| `--lumia-success` | Ready / Valid / Generated |
| `--lumia-warning` | 警告 |
| `--lumia-danger` | Invalid / Error / Danger |
| `--lumia-border` | 低对比分割 |
| `--lumia-focus` | 键盘焦点 |

橙色不得当普通 Button。紫色不得当导航选中。绿色不得当普通选中。

Dark 的 `--lumia-paper` / `--lumia-editor` 是深色作业面，不是米白。

### 字体

- UI：系统 Sans，13px，行高 1.45。
- 小标签：10–11px。
- 工具标题：Georgia / Songti SC，15–18px，只用于产品和工具名。
- 代码与值：系统 Mono，12–13px，行高 1.55。
- 中文正文行高不低于 1.7。
- `body` 字号必须是 13px，禁止 14px 旧值。

### 密度

- 默认控件：30px。紧凑：26px。
- Topbar 52 / Toolbar 50 / Status 30 / Panel Header 44 / Shelf 224。
- 间距只使用 4 / 8 / 12 / 16 / 24。禁止 5、6、9、10、14、15、18。

### Radius 与阴影

- 控件 7px。Panel 11px。
- 普通 Panel 无阴影，用 `--lumia-border`。
- Dropdown / Dialog / ExtendPage 用 `--lumia-shadow-overlay`。该 token 随主题变化。

## 组件规范

生产必须提供与 DS 同名的 React primitive，而不是给 Pico 旧件贴 class。

### Button

- `primary`：`--lumia-primary`，每区域最多一个。
- `secondary`：raised 中性。
- `danger`：低饱和红底，禁止 `#ed4014`。
- `selection`：只用于导航，不是普通动作。
- 外包一层无语义 `div` 禁止。高频折叠钮只有 `aria-label`，不要 `title` 悬空 tooltip。

### Panel

Header + Body + 可选 Footer。操作在 Header 内。输入用 `data-surface="editor"`，结果默认 paper，参数用 `controls`。

### ResultRow

标签 → 完整值 → 就近操作。Empty 为 `—` 且无 Copy。错误值不可复制。长值内部滚动。

### Form Control

可见 Label。开关用文字。Disabled 说明原因。参数放固定 Rack。

### Empty / Error / Loading

Empty 安静、无空动作。Error 单个 `role="alert"`。Loading 保持尺寸。

## 页面模板

只有 6 种。Diff 是 Editor 的特例，不是第 7 种。Hash、时间、进制等走 Utility，禁止再开 `hash.css` 私有模板。

### Transformer

`Source | Result`。编码、类型、Key/IV 在 Header 或 Rack。

### Editor

`Command Bar + Dominant Editor`。Monaco 占剩余空间。Diff：`Original | Modified`，比较区占满，导航不遮挡。

### Inspector

`Raw Source | Structured Output`。解析选项在 Header。

### Generator

`Options | Preview/Result`。预览有最大尺寸。QR 的高级选项是 Rack，不是盖在输入上的 Settings。

### Tester

`Configuration + Action + Workspace/Log`。日志占剩余空间。

### Utility

紧凑表单 + 就近 ResultRow。不得拉成巨大空 Pane。

## 工作台

- Topbar：品牌、搜索、历史、设置。快捷键按平台。
- Shelf：分类 + 工具列表。工具图标后续替换为 16px stroke 图标；在图标集落地前可用短标记（`JWT`、`{}`），同一区域风格必须一致。
- 历史和设置只出现一处主入口。Shelf footer 不得再复制一份。
- Toolbar：当前工具名 + feature tabs。
- Status：真实编码 / 特征 / 处理态 / READY|INVALID|EMPTY。文案走 i18n。

## 响应式

页面内容用 Container Query：

- > 760px：双栏。
- 520–760px：上下排列。
- < 520px：参数换行，结果值独占下一行。
- 窗口 < 720px：工具架变抽屉。

不得用 `display:none` 删除输入、结果或导航能力。

## 图标

- App Icon：Lumia Beam，可用橙紫。
- 功能图标：20×20 viewBox，默认 16px，1.5px 描边，Round Cap/Join，`currentColor`。
- 单色。颜色只来自状态或 selection。
- 禁止 Emoji、装饰图标、英文名 `.slice(0,2)`。

## 文案

短动词：复制、生成、格式化、加载、清空。中英文跟语言设置。组件内不硬编码另一语言。状态短标签可保持 READY / VALID / INVALID，但必须 i18n。

## Token 清单

几何与运动不随主题变化。颜色必须成对存在。权威值在 `designs/lumia-design-system/tokens/`。

生产 `tokens.css` 必须镜像这些语义名。不得保留「只换 chrome」注释。

## Agent 实现契约

改 UI 前：

1. 确认模板。
2. 只使用 `--lumia-*`。
3. 在 Light 和 Dark 各验收 1568×953 与 700×600。
4. 检查：控件是否漂浮、标签是否丢失、值是否截断、动作是否远离目标、主题切换后 chrome 与 workspace 是否一起变。
5. 生产构建后才可声明完成。

未合并本规范到生产 CSS 之前，不得宣称主题已修好。
