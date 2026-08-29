window.__overlays = {
    views: [
        {
            id: "task-focus",
            label: "任务聚焦",
            sentence: { metric: "任务聚焦", cohort: "Hash 工作台", window: "运行界面" },
            finding: "工作区的输入与结果结构正确，但左侧工具架和顶栏在同一视野里争夺注意力，首个输入动作不够强。",
            dim: 1,
            elements: [
                { id: "wide-form-rack", callout: { pin: 1, head: "输入区缺少首要动作", body: "编码与文本类型的控制紧贴输入顶部，但没有可辨识的输入起点或明确的主任务提示。首次使用时，用户需要先判断该往哪里写、参数是否已经生效。方向：将 Input 标题、类型选择和输入面组合成一个有明确焦点的 Source Pane；只保留与该输入直接相关的操作。", place: "right" } },
                { id: "wide-output", callout: { pin: 2, head: "空结果占据过多同权空间", body: "Hash 的五行输出在空状态下与输入编辑器拥有接近的视觉权重，导致工作区在未输入前显得静止。方向：空状态时降低结果行的高度或加入安静的结果说明；有值后再扩展为完整结果列表。", place: "left" } },
                { id: "wide-tool-grid", callout: { pin: 3, head: "导航标记难以扫读", body: "工具名上方的两三位字母与正文的大小、间距和对比度接近，不能形成稳定的识别锚点。方向：落地统一的 16px stroke 图标；在此之前，至少让短标记退为次级 mono 标签，工具名称成为唯一主标签。", place: "right" } },
                { id: "wide-search", callout: { pin: 4, head: "搜索在宽窗中偏弱", body: "搜索框宽度实际仅 150px，远小于布局所允许的 360px 上限；它是快速跳转工具的关键入口，却看起来像辅助控件。方向：在宽窗固定到约 280–320px，并为 placeholder 明确搜索对象。", place: "below" } }
            ]
        },
        {
            id: "visual-consistency",
            label: "视觉一致性",
            sentence: { metric: "视觉一致性", cohort: "Light / Dark", window: "运行界面" },
            finding: "双主题的语义表面已完整切换，宽窗的主要问题不是配色，而是 chrome、输入和结果 Pane 的边界密度过高。",
            dim: 1,
            elements: [
                { id: "light-workspace", callout: { pin: 1, head: "浅色 Pane 边界堆叠", body: "主工作区同时出现外层圆角、输入卡圆角、标题栏分隔、内层编辑区、结果行分隔；在浅色主题里它们叠加成连续的浅灰框。方向：遵循“结构先于容器”：保留 Pane 外框与必要的标题分隔，移除编辑区或结果行中重复的卡片边界。", place: "left" } },
                { id: "light-shelf", callout: { pin: 2, head: "工具架卡片感与对比度", body: "每个工具都是独立浅色矩形，工具数增多后会变成卡片墙。实测 muted 文本在 raised 卡片上为 4.73:1，刚过 AA；直接落在 shelf 表面时仅 3.76:1，不满足小字号正文。方向：未选工具改成轻量行/块，同时提升导航次级文字对比度；仅当前工具保留 selection surface。", place: "right" } },
                { id: "light-topbar", callout: { pin: 3, head: "顶栏层级可以更安静", body: "品牌、搜索、历史与设置都位于一条很轻的横线上；基础结构正确，但品牌标题过小，右侧动作与搜索的对齐关系也不够成组。方向：保持 52px 高度，给品牌更稳定的左侧锚点，搜索与右侧动作使用一组清晰的间距节奏。", place: "below" } }
            ]
        },
        {
            id: "responsive-accessibility",
            label: "响应式与可访问性",
            sentence: { metric: "响应式与可访问性", cohort: "700px 工作台", window: "运行界面" },
            finding: "700px 窄窗保留了全部关键能力，结构没有崩坏；但内容高度分配使 Output 在首屏几乎不可读，抽屉导航也需要一次真实点击复核。",
            dim: 1,
            elements: [
                { id: "compact-input", callout: { pin: 1, head: "输入独占首屏高度", body: "空输入编辑器在 700×600 窗口占据约 60% 高度，Output 标题刚露出即被状态栏截断。方向：给 Utility / Transformer 类工具使用最小且可伸缩的输入高度；空状态优先保证输入和至少一行结果同时可见。", place: "right" } },
                { id: "compact-output", callout: { pin: 2, head: "结果不可在首屏判断", body: "当前窄窗虽保留了 Output，但其内容区未出现，用户输入后不能立刻确认结果。方向：在此断点采用明确的上下 55/45 或可拖拽 splitter，而不是沿用桌面高度。", place: "above" } },
                { id: "compact-topbar", callout: { pin: 3, head: "动作仅剩图标需要状态验证", body: "History 与 Settings 在窄窗中变为无文字图标；aria-label 已存在，是好的基础。此截图无法判断 hover、focus-visible 和抽屉打开后的焦点管理。方向：实现前后用键盘逐项验证焦点顺序、Esc 关闭抽屉和焦点回归。", place: "below" } },
                { id: "compact-status", callout: { pin: 4, head: "状态栏信息密度偏低", body: "状态栏只呈现当前 feature 与 READY，留有大面积空白。方向：若没有真实处理态，不必填充伪指标；可以缩减其视觉存在感，或将真实输入编码、错误与处理结果放到这里。", place: "above" } }
            ]
        },
        {
            id: "working",
            label: "保留项",
            sentence: { metric: "保留项", cohort: "Hash 工作台", window: "运行界面" },
            finding: "当前工作台已经具备可靠的结构骨架：主题语义完整、主内容不被抽屉遮蔽、工具与 feature 的位置明确。整改应收敛层级，而不是重做布局。",
            dim: 1,
            elements: [
                { id: "wide-output", callout: { pin: 1, head: "双栏任务结构清晰", body: "宽窗下 Source 与 Result 的并置符合 Hash 的心智模型，输入和输出的区域边界也保持稳定。保留这个布局，只优化空状态及 Pane 内的边界层级。", place: "above" } },
                { id: "wide-shelf", callout: { pin: 2, head: "分类与工具路径直接", body: "分类条、当前分类工具和常用动作均集中在同一工具架，定位成本低。保留这条路径，避免把工具目录另起一个主导航。", place: "right" } },
                { id: "compact-toolbar", callout: { pin: 3, head: "窄窗保留工具上下文", body: "窄窗没有隐藏当前工具名；用户从抽屉返回后仍能知道自己所在位置。这是正确的响应式取舍。", place: "below" } }
            ]
        },
        {
            id: "small-stuff",
            label: "细节清单",
            sentence: { metric: "细节清单", cohort: "全局工作台", window: "运行界面" },
            finding: "以下是可在主问题收敛后一次完成的低风险细节，不建议提前分散整改注意力。",
            dim: 1,
            elements: [
                { id: "wide-brand", callout: { pin: 1, head: "品牌可读性", body: "LumiaTool 标题在宽窗中可见，但字号和灰阶接近工具栏正文。方向：保持 serif 标题，微增字重或对比度，不要再加入装饰性 Beam。", place: "below" } },
                { id: "wide-status", callout: { pin: 2, head: "状态标签大小写", body: "HASH 与 READY 均采用紧凑大写，适合桌面 chrome；需确认所有状态均走 i18n 且只在真实状态下出现。", place: "above" } },
                { id: "wide-tool-grid", callout: { pin: 3, head: "卡片点击面积", body: "当前 60px 高度满足基础点击面积。后续将卡片轻量化时，不要缩小命中区域或丢掉 keyboard focus ring。", place: "right" } }
            ]
        }
    ]
};
