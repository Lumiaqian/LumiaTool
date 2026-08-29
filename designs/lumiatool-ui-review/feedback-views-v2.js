window.__overlays={views:[
{id:"blocking-a11y",label:"阻断级交互",sentence:{metric:"阻断级交互",cohort:"当前工作台",window:"实际运行"},finding:"覆盖层没有接管焦点、没有 dialog 语义，Escape 也不关闭。对键盘与辅助技术用户，这是首要问题；视觉整改必须排在其后。",dim:1,elements:[
{id:"settings-sheet",callout:{pin:1,head:"设置不是可访问的对话框",body:"实际打开设置后，焦点仍停留在触发 Settings 按钮，覆盖层没有 role=dialog 或 aria-modal。结果是 Tab 会继续访问被遮住的工作台。方向：由 ExtendPage 在 present 时设置 dialog 语义，聚焦首个可操作控件，并实施 focus trap 与关闭后的焦点回归。",place:"left"}},
{id:"settings-close",callout:{pin:2,head:"关闭路径不完整",body:"实际按 Escape 后设置保持打开。右上 Close 是唯一明确关闭路径，且视觉上极轻。方向：支持 Escape、Close、可选 backdrop；三个路径都恢复到触发按钮。",place:"below"}},
{id:"settings-underlay",callout:{pin:3,head:"底层导航仍然可见",body:"覆盖层只替换右侧工作区，左侧工具架仍然完整可见且可被焦点访问。这可作为产品布局选择，但不能同时让它处于当前对话任务的键盘路径里。方向：打开 modal 时 inert 背景，或把 Settings 改为非 modal side page 并明确其导航模式。",place:"right"}},
]},
{id:"template-architecture",label:"模板架构",sentence:{metric:"模板架构",cohort:"Editor / Generator / Tester",window:"宽窗"},finding:"不同工具模板的基本骨架能工作，但命令、参数和结果的布局语言不统一；用户每换一个工具就要重新学习哪里能操作。",dim:1,elements:[
{id:"json-command",callout:{pin:1,head:"JSON 命令栏是无层级按钮堆",body:"Format、Indent、Compress、Escape、Unicode、Key Sort 等 10+ 操作处于同一视觉平面；没有主动作、没有分组、没有溢出策略。方向：分为 Format、Transform、Structure 三组；默认显示高频项，其余放入 More，避免横向按钮墙。",place:"below"}},
{id:"json-tabs",callout:{pin:2,head:"工具 feature 与命令栏竞争",body:"Common / Path / To Object / From / To 与下方命令都像标签，连续两层都承担导航语义。方向：feature tabs 只切换工作模式；每个模式内部的 command bar 使用独立的组标题或工具栏样式。",place:"right"}},
{id:"json-editor",callout:{pin:3,head:"空编辑器缺少起点",body:"主编辑面巨大但没有示例、拖放提示或明确的输入语言说明。方向：空状态给一个最小 JSON 示例/粘贴提示；内容进入后自动退场，保留纯编辑面。",place:"above"}},
{id:"json-shelf",callout:{pin:4,head:"工具架编码噪音跨模板存在",body:"JSON、QR、WebSocket 都把短码与名称等权展示，扫描工具时先读到的是缩写而不是任务名。方向：用统一 16px stroke 图标替换短码；实现前将短码降为次级 mono 标记。",place:"right"}}
]},
{id:"actions-states",label:"动作与状态",sentence:{metric:"动作与状态",cohort:"WebSocket",window:"实际运行"},finding:"Tester 的动作状态表达不可靠：连接配置、空日志和运行错误没有统一的可读反馈层。",dim:1,elements:[
{id:"ws-connect",callout:{pin:1,head:"连接栏聚集太多状态",body:"连接状态、URL、协议、自动重连、Connect 同行排列，字段之间缺少明确标签。方向：URL 是主字段，协议和 reconnect 收进可展开 Connection options；状态作为独立 pill，避免在输入前缀中混入红点。",place:"below"}},
{id:"ws-log",callout:{pin:2,head:"日志空态不说明可达性",body:"右侧仅显示 Connect，无法区分“尚未连接”“正在连接”“连接失败”。方向：空态要带状态图标与句子，例如“连接后在此显示请求、响应和事件”；错误时直接显示失败原因。",place:"left"}},
{id:"ws-toast",callout:{pin:3,head:"运行错误泄漏为内部信息",body:"实际页面出现“AbstractContextKeyService has been disposed”。这是框架内部错误，用户无法行动且破坏信任。方向：捕获并记录原始错误，界面只显示任务级消息；开发环境可额外写 console。",place:"below"}}
]},
{id:"generator-actions",label:"生成器动作",sentence:{metric:"生成器动作",cohort:"QR Code",window:"实际运行"},finding:"QR 的左右结构成立，但主动作与输入距离过远，结果空态也没有形成可执行路径。",dim:1,elements:[
{id:"qr-result",callout:{pin:1,head:"生成器结果空态过于被动",body:"QR 预览只显示 No data，右侧近半屏没有引导。方向：将结果空态关联左侧输入：“输入内容后生成预览”；生成成功后显示尺寸、下载/复制等贴近预览的动作。",place:"left"}},
{id:"qr-action",callout:{pin:2,head:"Generate 与输入距离过远",body:"主 Generate 动作位于最右上 feature tab 区，远离输入区。方向：主动作放在 Source Pane header 或输入底部，预览区保留导出动作。",place:"below"}},
{id:"qr-source",callout:{pin:3,head:"Source 与参数边界不清",body:"Settings、输入类型和编辑面共享同一顶部浅绿色条，层级较弱。方向：Source Pane header 只放输入类型与设置，主编辑面保持纯净；高级设置展开到固定 Rack。",place:"right"}}
]},
{id:"responsive",label:"窄窗",sentence:{metric:"窄窗",cohort:"700×600",window:"JSON Editor"},finding:"窄窗没有水平溢出，基础响应式成立；但仅仅换行没有解决命令密度与首屏任务焦点。",dim:1,elements:[
{id:"compact-top",callout:{pin:1,head:"顶栏保留了正确的最小集合",body:"Tools、搜索、历史、设置仍可访问，且搜索没有被删除。这是正确基础。后续要确认抽屉打开后焦点进入抽屉，并可用 Escape 返回触发按钮。",place:"below"}},
{id:"compact-tabs",callout:{pin:2,head:"模式标签占据独立一行",body:"Common / Path / To Object / From / To 在 700px 尚未溢出，但与命令区加起来占较高首屏。方向：将低频 mode 放入 More 或按当前 JSON 模式动态显示相关命令。",place:"right"}},
{id:"compact-command",callout:{pin:3,head:"按钮换行只是压缩，不是重构",body:"命令栏从一行折为两行，仍包含全部低频操作，文本按钮不断换行。方向：窄窗保留 Format、Repair、More 三项，其他操作收进底部 sheet 或 overflow menu。",place:"below"}},
{id:"compact-editor",callout:{pin:4,head:"编辑器可见高度仍足够",body:"命令收敛后，这块 48% 高度的编辑器可以成为稳定主焦点；不要再用浮动选项覆盖它。",place:"above"}}
]},
{id:"theme",label:"主题与密度",sentence:{metric:"主题与密度",cohort:"Dark mode",window:"Tester"},finding:"深色主题的表面语义完整，主问题是小字号次级信息与 disabled 控件在深色下接近不可见。",dim:1,elements:[
{id:"dark-panels",callout:{pin:1,head:"深色 Pane 层级基本健康",body:"workspace、编辑面、标题条和边界仍可区分，没有出现浅色 paper 泄漏。这是应保留的主题基础。",place:"above"}},
{id:"dark-disabled",callout:{pin:2,head:"禁用动作几乎消失",body:"Disconnect Reconnect、Copy Clear 等禁用控件的文本接近背景，用户很难分辨它们是不可用还是未加载。方向：disabled 保留可读文本和说明色，使用低对比表面而不是把前景色降到接近零。",place:"below"}},
{id:"dark-top",callout:{pin:3,head:"顶栏信息分散",body:"品牌、搜索和两项图标动作间距很大，右侧状态缺少分组。方向：宽窗中把搜索作为明确中枢；历史和设置形成紧凑 action group。",place:"below"}},
{id:"dark-shelf",callout:{pin:4,head:"选中态明显，未选项过弱",body:"当前工具的橙色 selection 清晰，但未选工具的短码和名称在深色下扫描困难。方向：提升未选 label 的对比度，并移除与名称竞争的短码权重。",place:"right"}}
]},
{id:"empty-states",label:"空态",sentence:{metric:"空态",cohort:"History",window:"实际运行"},finding:"空页面保持安静是对的，但当前空历史没有说明数据从哪里产生，也没有下一步。",dim:1,elements:[
{id:"history-empty",callout:{pin:1,head:"空历史缺少下一步",body:"History 只有 No data，无法告诉用户怎样产生记录或回到当前工具。方向：说明“运行一次工具后会显示在这里”，并提供返回当前工作区的明确动作。",place:"above"}},
{id:"history-title",callout:{pin:2,head:"覆盖层标题清晰但空间失衡",body:"History · WebSocket 提供了当前工具上下文，这是正确的；但空状态下整页只承载一个小图标。方向：保持标题，使用紧凑说明和主动作，不要用空白填充缺失的信息。",place:"below"}}
]},
{id:"working",label:"保留项",sentence:{metric:"保留项",cohort:"当前工作台",window:"多模板"},finding:"不应重做整体框架。当前最有价值的是固定的 desktop chrome、稳定的工作区边界和没有横向溢出的窄窗主编辑器。",dim:1,elements:[
{id:"qr-source",callout:{pin:1,head:"Generator 的左右任务模型成立",body:"Source 与 Preview 在 QR 场景下符合用户预期。整改应移动 Generate 动作、加强空态，不应改掉左右结构。",place:"right"}},
{id:"qr-result",callout:{pin:2,head:"预览区尺寸充足",body:"预览区有足够空间承载 QR 图形、下载与复制；这为成功态提供了良好基础。",place:"left"}}
]}
]};