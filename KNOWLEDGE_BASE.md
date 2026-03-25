# Doomsday Clock Knowledge Base

## 1. 项目定位

Doomsday Clock 是一个公开、可审计的 AI 劳动力替代压力静态网站。

它不是实时联网监控系统，也不是黑箱预测模型，而是一个由人工审核数据、版本化方法学和前端静态展示组成的公开指标项目。

当前仓库路径：
`/Users/zijiechen/Library/Mobile Documents/com~apple~CloudDocs/AI/doomsday-clock`

当前线上部署方式：
- GitHub Pages
- 站点基址：`https://zijiebuzhuang.github.io/ai-doomclock`
- Vite base：`/ai-doomclock/`
- push 到 `main` 只部署代码/样式/文档版本
- 定时 `Refresh Data` 独立部署最新 runtime 数据

## 2. 总体架构

项目可以分成三层。

### 2.1 数据层

目录：`data/`

作用：维护项目使用的原始结构化资料。

主要内容：
- `data/sources/manifest.json`：来源白名单与来源元数据，现已支持 `research-project` 类型和 `github-research-project` parser 的最小接入模型
- `data/signals/manifest.json`：慢变量信号
- `data/events/manifest.json`：里程碑事件
- `data/formula/config.v1.json`：方法学配置、权重、展示参数
- `data/site.json`：站点配置
- `data/generated/*.json`：脚本生成后的前端消费数据

### 2.2 计算层

目录：`scripts/`

作用：把原始数据加工成站点实际展示所需的 JSON，并同时产出运行时可直接读取的 `public/runtime/*.json`。

主要脚本：
- `validate-data.mjs`：校验数据完整性、素材存在性与发布门槛
- `fetch-sources.mjs`：保守版自动抓取入口，会对 approved/active 来源做抓取并自动更新 slow-variable signals，同时生成抓取报告；现已支持对 research-project 来源生成仓库级抓取摘要
- `build-evidence.mjs`：生成语料快照，并同步产出 `public/runtime/corpus.json`
- `compute-clock.mjs`：计算当前时钟状态、证据流、历史记录、元数据，并同步产出 `public/runtime/current.json`、`evidence.json`、`metadata.json`、`history.json`
- `export-public-docs.mjs`：把公开文档复制到 `public/docs`
- `prepare-public.mjs`：生成 robots、sitemap、manifest、CNAME 等发布文件

### 2.3 展示层

目录：`src/`

作用：读取生成后的 JSON，用 React + Vite 渲染静态站点。

核心入口：
- `src/main.tsx`：挂载 React 应用
- `src/App.tsx`：组合页面主结构

核心组件：
- `src/components/ClockPanel.tsx`
- `src/components/EvidencePanel.tsx`
- `src/components/EvidenceItem.tsx`
- `src/components/MethodologyFooter.tsx`

样式体系：
- `src/styles/tokens.css`：全局设计变量
- `src/styles/app.css`：页面布局与组件样式

## 3. 当前数据流

### 3.1 页面如何拿数据

当前页面已经切换为：
- 运行时优先 fetch `public/runtime/current.json`
- 运行时优先 fetch `public/runtime/evidence.json`
- 运行时优先 fetch `public/runtime/metadata.json`
- 如果运行时数据不可用，再回退到构建时打包进去的本地 JSON

这意味着：
- 前端开始从“构建时绑定数据”转向“运行时读取最新数据”
- 页面已经具备与代码版本解耦的数据更新能力
- 当前仍保留本地回退，避免在线数据短暂失败时整站不可用

### 3.2 审核状态的意义

当前项目依赖“白名单 + 审核状态”控制数据是否进入最终结果：
- source 只有 `reviewStatus === approved` 才算有效来源
- signal 只有 `reviewStatus === accepted` 才进入计算
- event 只有 `status === accepted` 才进入 shock 计算

这保证了项目不是“自动抓到就发”，而是“先审后算”。

## 4. 核心计算逻辑

核心文件：`scripts/compute-clock.mjs`

### 4.1 输入

会读取：
- `data/formula/config.v1.json`
- `data/site.json`
- `data/signals/manifest.json`
- `data/sources/manifest.json`
- `data/events/manifest.json`
- `data/generated/history.json`

### 4.2 signals 的计算

对 accepted signals：
- 根据 `signal.key` 读取 `config.weights`
- 使用 `signal.value * weight`
- `advance` 记正值
- `delay` 记负值

这会得到每个慢变量的加权贡献值。

### 4.3 events 的计算

对 accepted events：
- 使用 `severity`
- 根据 `effect` 决定正负方向
- 根据 `halfLifeDays` 做衰减

所以里程碑事件不是永久等权，而是随时间衰减。

### 4.4 综合结果

主要中间量：
- `signalContribution`
- `shockContribution`
- `frictionPenalty`

最终会得到：
- `compositeScore`
- `rawEstimate`
- `actualReplacementEstimate`
- `minutesToMidnight`
- `displayTime`
- `breakdown`

### 4.5 输出文件

`compute-clock.mjs` 会写出：
- `data/generated/current.json`
- `data/generated/history.json`
- `data/generated/evidence.json`
- `data/generated/metadata.json`

## 5. 当前界面结构

## 5.1 主页面结构

`src/App.tsx` 由三块组成：
- 左侧主时钟区 `ClockPanel`
- 右侧证据区 `EvidencePanel`
- 底部公共记录区 `MethodologyFooter`

### 5.2 ClockPanel

作用：展示时钟读数、解释框、驱动因素、模型拆解和关键指标。

主要功能：
- 用 SVG 绘制钟盘、刻度、时针、分针
- 根据 `current.displayTime` 计算指针角度
- 点击圆形箭头可弹出术语定义
- 展示当前驱动因素 `drivers`
- 展示 breakdown 排名
- 展示四个摘要指标：
  - Composite score
  - AI-performable share
  - Already replaced
  - Uncertainty band

当前视觉细节：
- 分针已改成描边长方形
- 当前宽度为 10
- 标题与说明按钮使用统一的圆形箭头样式

### 5.3 EvidencePanel

作用：告诉用户“当前判断依据了哪些证据”。

主要功能：
- 展示更新时间
- 展示统计数字：Reviewed items / Sources / Signals
- 区分 Milestones 和 Signals 两类证据
- 每个区块有说明按钮，点击弹出定义说明
- Signals 有预览上限，超过上限只展示部分并提示还有更多

当前响应式细节：
- 小屏下统计区改为 2 列布局
- 前两个指标同排
- 第三个自动换到下一行

### 5.4 EvidenceItem

作用：渲染单条证据。

显示内容：
- 日期
- 标题
- 摘要
- 来源名称
- 方向
- 审核状态
- shock 类型时显示 Milestone 标记

标题链接直接跳转原始来源。

### 5.5 MethodologyFooter

作用：把结果页连接到公开文档。

当前入口：
- `methodology.md`
- `sources.md`
- `formula.md`
- `governance.md`
- `faq.md`

## 6. 当前公开文档与内部文档

### 6.1 public docs

目录：`docs/public/`

包含：
- `methodology.md`
- `sources.md`
- `formula.md`
- `governance.md`
- `faq.md`

这些文件会被 `export-public-docs.mjs` 同步到 `public/docs/`，供线上站点访问。

### 6.2 internal docs

目录：`docs/internal/`

当前已有：
- `decision-log.md`
- `maintenance-runbook.md`
- `research-scope.md`
- `source-intake.md`

含义：
- `source-intake.md` 规定来源分层，A/B 可实质影响核心模型，C 可辅助事件审查，D 不应直接推动时钟
- `maintenance-runbook.md` 记录例行维护动作与常见故障模式

## 7. 校验与发布规则

### 7.1 数据校验

`validate-data.mjs` 当前会检查：
- sources 非空，字段完整，id/url 不重复
- approved sources 至少 6 个
- signals 非空，字段完整，sourceIds 合法
- accepted signals 至少 6 个
- events 字段完整，sourceIds 合法
- accepted events 至少 2 个
- accepted event 至少要有 2 个来源，用于交叉佐证
- evidence 输出不能含非 accepted 项
- `site.domain` 与 `site.canonicalBase` 必须存在

### 7.2 发布准备

`prepare:release` 顺序：
1. `refresh:data`
2. `export:docs`
3. `prepare:public`

`prepare-public.mjs` 会生成：
- `public/robots.txt`
- `public/sitemap.xml`
- `public/site.webmanifest`
- `public/CNAME`（仅当 `cnameEnabled` 为 true）

### 7.3 自动部署

GitHub Actions 文件：`.github/workflows/deploy-pages.yml` 与 `.github/workflows/refresh-data.yml`

当前行为：
- `deploy-pages.yml`：push 到 `main` 时部署代码版本
- `refresh-data.yml`：定时抓取、校验、构建并直接部署带最新 `public/runtime/*.json` 的 Pages 工件

这意味着：
- 代码发布链路和数据刷新链路已经开始分离
- `deploy-pages.yml` 只部署代码版本，不再主动刷新数据
- `refresh-data.yml` 定时抓取并直接部署带最新 `public/runtime/*.json` 的 Pages 工件
- 数据更新不再必须依赖 git commit 才能触发线上变化

## 8. 当前项目的重要事实

- 现在的线上部署不是自定义域名，而是 GitHub Pages 路径站点
- `data/site.json` 的 `domain` 和 `canonicalBase` 已与 GitHub Pages 对齐
- `vite.config.ts` 的 `base` 是 `/ai-doomclock/`
- 站点素材已放在 `public/assets/`，当前包含 og 图、favicon、apple touch icon、192/512 PWA 图标
- `prepare-public.mjs` 会基于 `canonicalBase` 生成 robots、sitemap、manifest，并在 `cnameEnabled` 为 false 时清理旧 `public/CNAME`
- 项目当前明确是“manual-whitelist-only”，不启用自动远程抓取
- 线上展示依赖生成文件，因此纯跑 `npm run build` 不等于完整刷新数据

## 9. 常用命令

- 开发预览：`npm run dev`
- 数据校验：`npm run validate:data`
- 重新计算：`npm run compute`
- 生成语料快照：`npm run build:evidence`
- 刷新数据：`npm run refresh:data`
- 导出文档：`npm run export:docs`
- 准备发布：`npm run prepare:public`
- 完整发布前准备：`npm run prepare:release`
- 前端打包：`npm run build`

## 10. 与这个项目协作时的注意事项

- 这是独立项目，不要和 even 系列项目混用代码或设定
- 处理 UI 变更时，先本地预览，用户确认后再 push
- 给用户生成的本地报告文件默认不要提交进仓库
- 网络相关操作默认走代理
- 涉及线上结果时，优先确认是否只是前端改动，还是需要连同生成数据一起刷新

## 11. 当前最自然的后续演进方向

- 增加历史趋势可视化
- 增加证据筛选与分类浏览
- 继续统一界面上的定义说明与公开方法学文本
- 如果未来转向半自动更新，可在保留人工审核门槛的前提下扩展 intake 流程
