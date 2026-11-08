# DuoBump · 双人孕期指南

一个移动端优先的中文孕期静态网站。三阶段指南与47类身体及情绪状况、15 类产检与准备事项、准妈妈与伴侣行动、60 条食物资料、三套菜单、孕周计算、30 项待产清单、60 份机构与研究原文参考资料及本地全文搜索。

**当前状态：本地科普预览，尚未完成专业医学审核，未公开部署。** 不应将资料核查标记解读为医生审核。

## 本地运行

需要 Node.js 24（最低 22.23.4）和 npm。

```sh
npm ci
npm run dev
```

开发服务默认监听 `0.0.0.0:4321`。Astro 7 在部分代理环境中会自动转为后台进程，可使用 `npx astro dev status` / `npx astro dev stop` 查看或停止。

全站 Pagefind 索引由构建生成；检查搜索功能请使用生产预览：

```sh
npm run build
npm run preview
```

开发服务也支持检索上次生成的 `dist/pagefind` 索引；首次运行前先 build，之后内容更新需重新生成索引。预览模式反映最终静态产物。

## 静态 Hash 路由

默认链接采用 `/#/…`，不使用 History API，也不需要 Nginx rewrite 或 GitHub Pages 的 404 重定向技巧。

- 首页：`/#/`
- 产检与准备：`/#/appointments/`
- 参考资料：`/#/references/`
- 文章目录：`/#/overview/early/#先建立自己的产检计划`
- 仓库部署：`/duobump/#/appointments/`

构建继续生成所有独立 HTML。`scripts/build-router.ts` 在搜索索引生成之后保留首页为 `index.content.html`，再写入静态入口。浏览器按 hash 读取对应的预渲染页面；跨页重载入口以隔离页面脚本，页内目录只滚动并移动键盘焦点。刷新、浏览器前后退、搜索结果和动态推荐链接都保留部署前缀。样式和脚本初始化完成后才显示页面。

关闭 JavaScript 时，入口提供静态正文链接；原来的独立页面也能阅读。请通过静态 HTTP 服务访问，不能通过双击 `file://` 使用模块、搜索和页面读取功能。

开发模式使用相同入口，由 `astro.config.mjs` 将 `index.content.html` 映射到首页渲染结果。Markdown 链接通过原生 Sätteri 插件在构建时补齐仓库前缀，静态阅读路径也有效。

## 检查命令

```sh
npm run check
npm run validate:content
npm test
npx playwright install chromium
npm run build
npm run test:e2e
```

浏览器测试默认使用 4321 端口的构建预览。如果正在该端口运行开发服务，应先停止它，避免误把开发页面当作最终产物。

```sh
TZ=Asia/Shanghai npm run test -- tests/unit/pregnancy.test.ts
TZ=America/New_York npm run test -- tests/unit/pregnancy.test.ts
```

## 内容维护

- `src/content/guides/*.md`：三阶段、妈妈、伴侣及就医长文。Frontmatter 采用 YAML 元数据对象。
- `src/data/foods.json`：食物名称、别名、制备方式、条件、原因和 sourceIds。
- `src/data/sources.json`：官方来源机构、中英文标题、用途、网址、地区和核查日期；独立展示于参考资料页。
- `src/data/appointments.json`：产检阶段、目的、准备、问题、地区说明与来源。新增条目同样接受审核校验。
- `src/data/checklist.json`：30 项清单。上线后保持已有 ID 稳定，避免用户勾选丢失。
- `src/data/recipes.json` / `milestones.json`：菜单与按孕龄推荐的准备事项。
- `src/styles/global.css` / `refresh.css`：基础样式与第二版视觉、产检和资料页、响应式与打印样式。

每次修改内容都要核对实际原文、地区适用性和更新日期，运行内容校验，并重建搜索索引。不要把无法访问或未核实的资料写为已核查；不要虚构审核人。

进入内容目录的草稿会阻止构建；草稿请保存在发布目录以外，不会自动上线。各内容的 `reviewStatus` 支持 `draft`、`source-checked`、`clinician-reviewed`。**只有真正完成审核后**才能填写真实 `reviewer` 和 `reviewedAt` 并改为 `clinician-reviewed`。公开发布检查会校验医学内容的审核状态。

原始需求和实施任务见 `docs/superpowers/specs/` 与 `docs/superpowers/plans/`。当前验证与尚待事项见 `docs/release-checklist.md`。

## 隐私与降级

不使用账号、分析服务、广告或业务后端。日期默认只在会话中使用；用户主动开启记忆后写入 `duobump:pregnancy:v1`。清单写入 `duobump:checklist:v1`。两个键可分别清除，不上传服务器、不加入 URL、不跨设备同步。

存储失效时工具仍在当前会话工作。关闭 JavaScript 时仍可读正文、全部食物与三套菜单，可打印清单及就医页；计算和搜索需 JavaScript。

## GitHub Pages

1. 将此项目放入自己的 GitHub 仓库并提交 lockfile。
2. 在 Settings → Pages 选择 GitHub Actions。
3. Push / PR 触发类型、数据、单测、构建与浏览器检查。工作流自动为用户站点或仓库站点配置 `SITE_URL` 和 `BASE_PATH`。
4. 完成真实专业审核，补充必要的中国大陆官方资料及地区说明，运行 `npm run verify:release`。
5. 在 main 分支手动运行工作流才会尝试公开部署。审核未通过时部署作业会失败，检查作业仍可单独验证预览版。

公开发布时 `PUBLIC_RELEASE=true` 只改变搜索引擎索引策略，**不能替代审核检查**。不要移除部署中的审核命令来发布未审核医疗内容。

子路径测试示例（先停止已有 4321 服务）：

```sh
BASE_PATH=/duobump/ SITE_URL=https://example.github.io npm run build
BASE_PATH=/duobump/ npm run test:e2e
```

自定义域名需单独设置 Pages 与 `SITE_URL`，按实际部署确定 `BASE_PATH`，不要使用示例域名。初始配置的 `example.invalid` 只用于本地构建，不代表实际站点地址。

## 回滚与维护

公开发布后可 revert 到已验证版本并重新执行审核/发布工作流。保留该版本的内容审核记录；不要用不再有效的审阅记录覆盖新增医学内容。

至少每季度复查一次资料，权威建议发生重要变化时及时修订。若修改孕周算法、存储 schema、路由前缀或搜索构建，重新执行相关单测、浏览器测试及子路径回归。

## 验证普通静态托管

本轮根路径与 `/duobump/` 均使用 Python 普通静态 HTTP 服务器运行完整浏览器测试，未配置回退或重写。子路径可将 `dist-subpath` 放在静态站点的 `duobump/` 文件夹中：

```sh
BASE_PATH=/duobump/ BUILD_DIR=dist-subpath SITE_URL=https://example.github.io npm run build
```

保持整个构建目录，包括 `_astro/`、`pagefind/`、`hash-router.js`、`index.content.html` 和各内容目录一并上传。不要只上传入口 HTML。

### 中国大陆来源

参考资料页支持全部 / 中国大陆 / 英国 NHS 筛选，并按主题、机构或网址搜索。当前已读原文并关联 3 份国内资料：北京市卫健委发布的北京妇产医院产检及叶酸科普、广东省疾控中心备孕营养科普。各条保留完整原文网址、原文发布日期、本站核查日期与适用范围；地方医院科普不视为全国统一规范。医学内容仍待专业审核。

### 异常信号与概率证据

- `/risk-guide/`（浏览地址 `/#/risk-guide/`）：5 项研究，区分自然受孕、HRT-FET 和检查所见。每条显示人群、观察窗口、数据年代、分子分母、效应量/置信区间、局限和原文定位；不作个人风险预测。
- 紧急页增加 9 类异常信号、可能原因、行动和概率边界。
- 15 类产检/准备条目补充检查过程、局限和后续路径，新增动态 hCG、血清筛查、NIPT 与绒毛/羊水诊断。
- 参考库新增研究分组及其他地区筛选，英文中国队列按中国大陆筛选，语言单独标注。
- 核查记录：`docs/evidence/2026-11-08-bleeding.md`。2026 与 2009 的 RFTS 分析存在人群重叠；HRT-FET 仅读到作者公开摘要，已明确标注。存在内部数值不一致的 2025 比较研究未用于概率展示。
- 内容校验拒绝缺少分母、人群、观察窗口、来源、局限或有效 OR/HR 区间的概率条目，新增内容仍受专业医学审核发布门禁约束。
