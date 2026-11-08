# Guide Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 改进界面、检查准备信息、参考网址与静态 hash 路由。
**Architecture:** Astro 继续预渲染内容，独立静态入口加载 hash 指定的 HTML；跨路由重载入口，页内锚点单独处理。内容来源复用数据文件。
**Tech Stack:** Astro、TypeScript、CSS、Vitest、Playwright。
**Spec:** docs/superpowers/specs/2026-11-08-guide-refresh.md

## Global Constraints
- 无后端、无 History API、无第三方个人数据采集。
- 公开发布仍需真实医学审核，不编造国内检查窗口或审核身份。
- 不初始化用户身份或推送仓库。

## Review Focus
- 子路径下刷新/前后退/未知 hash 不丢失根前缀。
- 页内锚点不会覆盖路由，动态搜索结果与孕周推荐同样使用 hash。
- 页面脚本不能重复绑定，待产状态应跨页恢复。
- 官方网址真实可访问，英国筛查流程明确标明适用地区。
- 360px 无横向溢出，键盘及原有工具仍可用。

### Task 1: Hash 路由
Files: public/hash-router.js, public/entry.html, scripts/build-router.ts, astro.config.mjs, src/layouts/BaseLayout.astro, tests/e2e/hash-routing.spec.ts.
- [x] 写并运行失败浏览器测试：hash 直接打开、刷新、前后退、锚点、未知路径及子路径。
- [x] 实现静态入口、dev 入口中间件和经典脚本路由。保留静态内容页供抓取与无 JS 阅读。
- [x] 运行新增测试并回归原有交互。

### Task 2: 产检准备与来源
Files: src/pages/appointments.astro, src/pages/references.astro, src/data/appointments.json, src/data/sources.json, src/components/SourcePanel.astro, scripts/validate-content.ts, tests/unit/content.test.ts.
- [x] 浏览器测试检查新页面、原文 URL 可见和按阶段阅读。
- [x] 实际抓取官方检查相关来源，新增结构化检查和准备资料；纳入来源及审核校验。
- [x] 增加全站导航与相关文章入口，保留地区和审核说明。

### Task 3: 视觉与验收
Files: src/styles/global.css, src/pages/index.astro, src/pages/overview/index.astro, README.md, docs/release-checklist.md.
- [x] 优化主页行动卡、页面标题、卡片及时间轴，添加轻量动画和 reduced-motion 支持。
- [x] 执行类型、单元、构建、根/子路径浏览器测试；检查移动布局和截图。
- [x] 记录实际结果，复核变更并交付预览。不做无意义提交（当前无 Git 仓库）。

## 执行说明

- 用户已授权直接修改；沿用当前工作区（没有 Git 仓库），不初始化身份、不推送。
- 使用 Astro 7 原生 Sätteri HAST 插件处理 Markdown 前缀，显式声明当前已使用的处理器依赖，未引入旧版 Markdown 引擎。
- 新增浏览器测试先验证原实现失败；新增产检内容验证的两项单元测试先 RED 后 GREEN。
- 独立只读复核的两个重要发现已修复：Markdown 子路径链接、skip link 键盘焦点。来源锚点也有显式高亮。
- 开发模式输入过早导致监听器尚未绑定的问题，以脚本和样式就绪后显示页面修复；测试使用具体页面标题确认加载，避免将加载入口误判为清单页。
- 测试结果见 docs/release-checklist.md。本次未公开发布。
