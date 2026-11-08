# 异常信号、出血证据与检查科普 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 增加有研究背景的孕期异常说明，区分自然受孕、人工授精与 IVF/FET，补全检查原理、局限和后续路径。
**Architecture:** 静态 JSON 保存可追溯研究条目与异常信号；Astro 新增风险数据页并链接紧急页。内容验证器阻止缺失分母/人群/来源的概率条目进入构建，所有新增医学内容进入原有审核门禁。
**Tech Stack:** Astro、TypeScript、Vitest、Playwright；保持静态 Hash 路由。
**Spec:** 用户本轮要求；本计划中的 Global Constraints 为具体执行约束。

## Global Constraints
- 不计算个人诊断概率，不把出血率、血肿率、流产率混为一个指标。
- 每项研究标注人群、地区、数据年代、观察窗口、样本量、分母/比较对象、局限及原文位置。
- OR/HR 显示类型与 95% CI，不渲染为百分比；不把 12 周持续妊娠的补集称为流产。
- 对存在分歧的结论明确说明；2009 与 2026 RFTS 分析并非独立人群验证。
- 保留国内来源和适用地区筛选；中国研究不能伪装为政府指南。
- 无 Git 仓库，在当前已授权工作区编辑，不初始化仓库或部署；医学审核状态保持 source-checked。

## Review Focus
- 读者将不同人群数字直接相除：每研究独立卡片并明示不可直接比较。
- 读者有急症却去算概率：数据页顶部保留急救联系和明显紧急页入口。
- 研究英文但中国人群：语言与地区分别标记。
- 来源筛选隐藏新研究：新增研究分组和其他地区筛选，测试筛选组合。
- 嵌套锚点与手机宽度：根路径与子路径浏览器测试、360px 和键盘回归。

### Task 1: Evidence data and publication guard
**Files:** `src/data/risk-evidence.json`, `src/data/warning-signs.json`, `src/data/sources.json`, `src/lib/content-validation.ts`, `scripts/validate-content.ts`, `tests/unit/risk-evidence.test.ts`, `docs/evidence/2026-11-08-bleeding.md`。
**Interfaces:** evidence 条目拥有 results（fraction 或 reported 类型）、effects（OR/HR/adjusted-OR）、sampleSize、sourceIds；warnings 拥有 signals/action/possibilities/uncertainty/sourceIds。
- [x] 用真实验证器测试缺少人群/分母、越界比例、错把 HR 当百分比、无来源、未审核发布时拒绝。
- [x] 运行测试确认缺少规则而失败。
- [x] 加入已读原文的 5 项研究和临床说明，编写提取位置及排除理由；实现验证并全套单元测试。

### Task 2: Warning and probability pages
**Files:** `src/pages/risk-guide.astro`, `src/components/WarningSigns.astro`, `src/pages/emergency.astro`, `src/layouts/BaseLayout.astro`, `src/pages/references.astro`, `tests/e2e/evidence.spec.ts`。
**Interfaces:** 消费 Task 1 数据，使用现有 url() 保持 Hash/子路径兼容；筛选仅按人群检索研究，不推断个人概率。
- [x] 编写浏览器测试，运行确认缺少页面或交互而失败。
- [x] 增加人群筛选、文献方法与局限说明、直接文献跳转；紧急页增加 9 类信号与行动。
- [x] 参考库支持 research 分组和 US/DK 地区、语言与引用位置，回归测试。

### Task 3: Explain tests and final verification
**Files:** `src/data/appointments.json`, `src/pages/appointments.astro`, `src/content/guides/emergency.md`, `README.md`, `docs/release-checklist.md`, `tests/e2e/evidence.spec.ts`。
**Interfaces:** 检查条目新增 kind/how/limitations/followUp；保留现有 prepare、questions、sourceIds。
- [x] 测试检查科普展开和来源锚点，验证器拒绝缺失科普字段。
- [x] 补全现有条目，拆分 NT 与遗传筛查，新增 NIPT、血清筛查、绒毛/羊水诊断；专科超声按个体指征讨论，不添加无充分资料的统一检查。
- [x] 运行 check、全套单元、build、根路径与子路径全套 e2e、移动端目视检查；独立代码/引用审查后修复重要问题。

## 执行记录

- 内容规则已完成 RED→GREEN：7 个新增规则测试首次均失败，实现后全套 47/47 通过。新增浏览器交互测试首次因缺少风险页面失败，功能实现后通过。
- 当前工作区不是 Git 仓库，因此在用户授权目录直接编辑，不执行依赖 Git 的 ledger/commit 脚本；不新建仓库，不部署。
- 独立审查：无计数或分母不一致发现。瘙痒行动措辞作为重要问题修正，新增 UI 回归首次失败；HR 术语在审查反馈前已改为风险率比。
- 打印来源缺失按实际影响视为需修复的功能回归：已有打印能力新增内容仍应保留原文依据，新增浏览器打印测试覆盖外链和 CSS 展开网址。

已完成内容规则、页面交互、研究筛选、检查科普与来源数据；开发模式新增 6/6 用例通过，单元测试 47/47，Astro check 0 错误/警告。最终静态回归结果记录于 release-checklist，不创建 Git 提交或公网发布。
