# DuoBump 双人孕期指南 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 本文已执行至可运行技术预览；实际验收结果见 `docs/release-checklist.md`，专业医学审核与公开部署待完成。

**Goal:** 构建中文、移动端优先、可部署到 GitHub Pages 的双人孕期指南，使用户快速找到当前任务、饮食条件、伴侣分工和就医行动。

**Architecture:** Astro 静态生成内容页面，Markdown/MDX 承载长文，JSON 承载食物、清单与任务。客户端只负责日期计算、筛选、本地清单与搜索；没有业务后端。关键就医内容与来源随页面直接输出。

**Tech Stack:** Astro、TypeScript、Tailwind CSS、Pagefind、Vitest、Playwright、GitHub Actions / Pages。实施时确认各工具当前兼容版本并提交 lockfile，不在计划中猜测版本号。

**Spec:** `docs/superpowers/specs/2026-11-07-pregnancy-guide.md`

## Global Constraints

- 部署：GitHub Pages 静态站；不依赖服务端、数据库、账号或外部 AI API。
- 内容语言：简体中文；就医语境：中国大陆；紧急号码：120。
- 孕期划分：孕早期 <14+0、孕中期 14+0～27+6、孕晚期 ≥28+0。
- 首版内容预算：约 60 条食物、3 套菜单、约 30 项待产清单；来源不完整的条目不为凑数发布。
- 孕周与清单数据不上传；不接广告追踪；用户可分别清除清单与孕周设置。
- 不记录虚假的医生审核信息；关键就医内容未经专业审核，不公开发布。
- 无 JavaScript 时六个内容模块和紧急页仍可读。
- 视觉验收视口：360/390/768/1280px；主要触控目标至少 44px；风险不能只靠颜色表达。
- 性能验收目标：移动端 Lighthouse 性能 ≥90、无障碍 ≥95；需实际记录测量条件与结果。

## Review Focus

1. 末次月经/预产期在用户当地跨午夜、闰日、夏令时附近仍按日历日计算：Task 3 覆盖。
2. 未来末次月经、极端日期或医生修订预产期不能输出误导孕周：Task 3 覆盖。
3. localStorage 被禁用、配额耗尽、内容损坏或版本升级时页面可继续使用：Task 5 覆盖。
4. GitHub Pages 仓库子路径下刷新详情页、加载搜索索引和跳转结果都有效：Task 7 覆盖。
5. 用户搜索紧急症状无命中或脚本失败时仍能立即找到就医入口：Task 2 / 6 覆盖。

## 一、定位与首版边界

产品暂名 **DuoBump｜双人孕期指南**。核心体验是“今天该做什么、这个食物怎么吃、伴侣能做什么、何时需要求助”。内容语气温和直接，不使用“孕期什么都不能吃”的恐吓表达，也不将母体情绪简化为“无端发脾气”。

首版保留用户提出的六个模块；首页承担导航和当前孕周任务，待产清单作为伴侣指南的独立工具页。五天目标是完成可验收版本，医学审核与公开发布另设明确门槛。

不纳入：登录/云同步、自动通知、在线问诊、AI 风险判断、自动补充剂剂量、UGC、商品导购、完整离线 PWA。双人协作首版通过角色任务和打印清单实现，不承诺两台手机实时同步。

## 二、页面与内容结构

| 路由 | 首屏内容 | 核心模块 |
| --- | --- | --- |
| `/` | 定位、孕周设置入口、紧急就医按钮 | 当前阶段、近期任务、四个常用工具、伴侣本周行动 |
| `/overview/` | 三阶段时间轴 | 阶段变化、常见检查窗口、营养与行动 |
| `/overview/early/` | 孕早期概览 | 常见不适、常见检查、妈妈/伴侣任务 |
| `/overview/middle/` | 孕中期概览 | 胎动认知、检查选择、饮食运动 |
| `/overview/late/` | 孕晚期概览 | 随访与胎动变化、分娩准备、入院安排 |
| `/for-dad/` | 伴侣行动卡 | 倾听支持、家务、陪诊、交通、请假和待产准备 |
| `/for-mom/` | 日常护理导航 | 衣着、皮肤、卫生、运动、睡眠与常见困扰 |
| `/food-guide/` | 搜索框与风险说明 | 食物卡片、分类/风险筛选、别名查询 |
| `/food-guide/[slug]/` | 结论与处理条件 | 原因、份量/烹饪条件、特殊人群、来源 |
| `/recipes/` | 按阶段切换 | 3 套一日菜单、替换选项、过敏与特殊情况提示 |
| `/checklist/` | 本机完成进度 | 证件、妈妈、宝宝、交通与后勤；勾选、打印、重置 |
| `/emergency/` | 行动分级与联系信息 | 严重症状、立即行动、沟通准备、不能等待的情况 |
| `/about/` | 适用范围与内容政策 | 免责声明、来源规则、更新日志、反馈及隐私说明 |
| `/404.html` | 页面未找到 | 首页、搜索与紧急就医入口 |

所有常见检查标注“常见窗口，实际以当地医院与个人医嘱为准”；不将筛查写成确诊。地方建册、建档、陪产假及育儿假不写全国统一天数或期限，只给办理核对清单和当地官方查询方向。

## 三、上线前必须完成的内容校正

| 原蓝本表述 | 计划采用的规则 |
| --- | --- |
| 三阶段 1～12 / 13～27 / 28～40 周 | 明确显示产品采用 <14+0 / 14+0～27+6 / ≥28+0，所有检查用具体孕周表达；不把 40 周当作停止展示的边界。 |
| 6～8 周检查即可“排除宫外孕” | 描述为评估妊娠位置和发育；个别情况需要复查，不能保证一次检查排除所有风险。 |
| 所有人同时做唐筛和 NIPT | 分清检查性质、选择与适用情况，不设计自动替医生决定的筛查路线。 |
| 孕中期人人开始补铁、补钙约 1000mg | 区分饮食与补充剂、总摄入与药片剂量，解释依据饮食、化验和医嘱调整，不自动开剂量。 |
| 猫砂严禁接触 | 优先由他人处理；不得不处理时提供手套、洗手等官方预防措施，不制造养猫本身必然危险的印象。 |
| 水杨酸等一律停用 | 区分外用低浓度、口服和高浓度操作，保留维 A 酸/类维 A 酸警示与专业咨询入口。 |
| 山楂/桂圆/马齿苋等一概会导致流产 | 缺乏足够可靠依据时不下结论；药用提取物和普通食物分开，不把中药当日常食谱建议。 |
| 核桃/奇亚籽直接提供 DHA | 说明其主要提供 ALA，不等同于直接摄入 DHA。 |
| 每周一次动物肝脏补铁 | 中国和国外指南存在不同建议；默认菜单不放每周肝脏方案，交由专业审核说明份量与适用地区。 |
| 200mg 咖啡因等于固定杯数 | 保留咖啡因总量概念，提醒咖啡、茶、巧克力和能量饮料叠加，按产品实际含量估算。 |
| 每天固定计数或减少一半才异常 | 以个人胎动模式明显变化为求助理由，不能让用户等待固定阈值再联系产科。 |
| 任意出血都统一急诊；破水一律抬臀 | 出血尽快求助并按伴随症状分级；疑似破水立即联系产科，不统一指导抬臀；严重疼痛、大量出血、晕厥等突出急救行动。 |

食谱以“均衡示例”呈现，不输出治疗型控糖食谱。含蛋/肉/鱼的菜品注明充分加热；凉拌菜明确清洗、现做现吃及需要熟制的食材。汤不替代吃鱼肉和豆腐，不把水果、紫薯或杂粮写成无需控制份量。

### 来源与审核流程

每项内容经过：资料摘录 → 适用地区与结论核对 → 页面文案 → 专业审核 → 发布。发布后每季度例行复核，遇权威建议变更及时修订。页面分别显示“资料核查日期”和真实存在的“专业审核日期”；未审核不显示医生审核徽章。

首轮资料入口（2026-11-07 检索，尚不代表专业审核完成；下列注明待补核的入口不作为已核实的结论依据）：

- 待补核（本次抓取受限）：国家卫生健康委，产前检查说明：`https://www.nhc.gov.cn/zwgk/wtwj/201304/84ec2d5d37a54398ace49df48ca91c83.shtml`；北京市政府，产检重点与时间窗口：`https://www.beijing.gov.cn/fuwu/bmfw/jhsyfwzdzx/2024sjrkr/rdwd/202406/t20240611_3709426.html`。
- 中华医学会，孕期饮食科普：`https://www.cma.org.cn/art/2022/8/12/art_4584_47057.html`；待补核（本次抓取超时）：中华医学会围产医学分会，孕产妇血液管理专家共识：`https://cspm.cma.org.cn/index/news?id=3837`。与国外资料存在差异的建议交由专业审核决定适用口径。
- NHS，胎动变化：`https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/`。
- NHS，分娩征兆与破水：`https://www.nhs.uk/pregnancy/labour-and-birth/signs-of-labour/signs-that-labour-has-begun/`。
- NHS，孕期阴道出血：`https://www.nhs.uk/pregnancy/common-symptoms/vaginal-bleeding/`。
- NHS，食物与咖啡因：`https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/`。
- 待补核（本次抓取受限）：ACOG，孕期皮肤问题与外用成分：`https://www.acog.org/womens-health/faqs/skin-conditions-during-pregnancy`。
- CDC，弓形虫预防与孕期猫砂防护：`https://www.cdc.gov/toxoplasmosis/prevention/index.html`、`https://www.cdc.gov/toxoplasmosis/risk-factors/index.html`。
- NIH ODS，ALA / DHA 区别：`https://ods.od.nih.gov/factsheets/Omega3FattyAcids-Consumer/`。
- NHS，末次月经与预产期计算说明：`https://www.nhs.uk/pregnancy/finding-out/due-date-calculator/`。

## 四、交互规格

### 1. 孕周与近期任务

两种输入：末次月经第一天，或医生确认的预产期。两者同时存在时，以医生预产期为准并明确标注依据。默认不保存日期；用户勾选“仅在此设备记住”后才写入本地。

`calculatePregnancy(input, today)` 接受 `YYYY-MM-DD` 字符串，输出孕周、天数、预计预产期、阶段与日期来源，或明确的输入错误。日历日期转 UTC 日序号，不直接使用带时区的时间差。末次月经模式按 280 天估算，并标注月经周期不规则、辅助生殖等情况需采用医生结果；医生预产期模式以该日期反推 280 天。

当末次月经晚于今天、推算孕龄为负数、日期无效或超过产品正常展示范围 42+0 时，工具不输出常规任务列表，提示核对日期或联系产科；42+0 是工具边界，不能成为用户等待就医的依据。用户输入的日期与孕周不得被用于自动推断检查结果。

首页推荐最多 3 条当前相关任务，每条有适用孕周、角色和关联内容。任务为常见准备提示，不发送诊疗决策、自动用药建议或“胎儿一定正常”的保证。

### 2. 食物速查

- 首批覆盖饮品、水果、鱼虾海鲜、肉蛋奶、蔬菜豆类、零食及常见争议食物，总量约 60。
- 搜索匹配名称、别名与关键词；分类和风险筛选同时生效；清空恢复列表。
- 例：“咖啡”进入限量条件；“三文鱼”区分刺身与熟制；“螃蟹”给烹饪及过敏条件，不给缺乏依据的流产断言。
- 不只显示红黄绿；每张卡必须有文字结论、条件、简短原因、详情链接和来源。
- 无结果时给出替代关键词和“未收录不代表安全”的说明；不能自动生成结论。

### 3. 伴侣行动与待产清单

- 使用“伴侣/准爸爸”兼顾家庭结构，核心模块延续用户的男方专栏定位。
- 清单分为证件资料、妈妈用品、宝宝用品、交通后勤；约 30 项，数量可按医院要求调整。
- 单项记录负责人、收纳位置、是否必需；支持筛选未完成项、打印、单独重置。
- 本地键 `duobump:checklist:v1`；只保存稳定 itemId、勾选和用户主动填写的收纳位置，不保存病历或证件号码。
- 明确“仅此浏览器保存，不会同步给伴侣”；静态页面可分享，个人完成状态不包含在 URL 中。

### 4. 全站搜索与就医入口

Pagefind 在构建后生成索引，不上传搜索词。中文分词效果必须实测“咖啡、胎动、破水、待产包”；只索引发布的内容区，排除重复导航、草稿与示例。

页头和移动端底部提供紧急入口，按钮不能遮挡正文或系统安全区；紧急页先展示行动，后展示症状解释。提供医院联系方式准备提示，不默认存储个人电话。浏览器脚本失败仍能直接读到核心就医内容。

## 五、视觉与移动端规范

暖白底、低饱和绿色/杏色为常规色；红/橙仅承担风险提示。正文使用系统中文字体，16～18px；桌面正文宽度约 720～800px，卡片区域按空间适配，手机单列。

导航短而稳定：孕期阶段、妈妈护理、伴侣行动、饮食、待产清单；搜索与紧急入口常驻。首页控制模块数量，不使用巨幅插画挤占任务入口。图标加文字；动画遵守减少动态效果设置。

首版采用浅色主题，暗色模式排入后续版本，避免在五天内牺牲内容核查时间。清单和就医页使用独立打印样式，隐藏导航并保留来源/日期。

## 六、拟创建的文件与责任边界

```text
astro.config.mjs                     # static、site、base 与集成配置
package.json                         # dev/check/test/build/e2e 脚本
src/content.config.ts                # 内容集合与字段校验
src/content/guides/*.mdx             # 三阶段、妈妈、伴侣、就医及来源长文
src/data/foods.json                  # 食物与制备方式、别名、来源
src/data/checklist.json              # 约 30 项待产清单
src/data/milestones.json             # 按孕周/角色组织的任务
src/data/recipes.json                # 三套菜单与替换说明
src/data/sources.json                # 官方来源和地区、核查信息
src/layouts/BaseLayout.astro         # 导航、搜索入口、紧急入口、页脚
src/components/{FoodFinder,GestationTool,Checklist,SearchDialog}.astro
src/lib/{pregnancy,food-search,checklist,storage,urls}.ts
src/pages/                          # 与上文路由对应的静态页面
src/styles/global.css               # 响应式、焦点、风险、打印样式
scripts/validate-content.ts          # 引用、字段、审核状态与关联检查
tests/unit/*.test.ts                 # 日期、搜索、存储与数据约束
tests/e2e/*.spec.ts                  # 手机使用流程与子路径回归
.github/workflows/pages.yml          # 检查、构建、上传与部署
README.md                           # 内容维护、运行、部署和回滚
```

数据接口：

- `Source = { id, title, organization, url, region, checkedAt }`。
- 发布内容 `ArticleMeta = { title, summary, updatedAt, sourceIds, reviewStatus, reviewedAt?, reviewer? }`；`reviewStatus` 取 `draft | source-checked | clinician-reviewed`。
- `Food = { id, slug, name, aliases, keywords, category, preparations: { label, risk, conditions, reason, sourceIds }[], specialNotes }`；`risk` 取 `avoid | conditional | usually-ok | insufficient-evidence`。
- `ChecklistItem = { id, category, title, required, defaultOwner, note }`；本地 `ChecklistState = { version: 1, checkedIds: string[], locations: Record<string,string> }`。
- `Milestone = { id, fromDay, toDay, role, title, href, sourceIds }`。
- `Recipe = { id, stage, meals: { slot, dishes, swaps, allergens }[], notes, sourceIds }`。
- 文章和 JSON 都引用统一 `sourceIds`；校验不存在的引用、重复 ID 和失效路由。外链网络探测作为独立检查，不把网站暂时不可达等同于医学结论错误。

## 七、实施任务与验收

各任务按顺序实施，先完成失败测试再实现；每项通过后形成一个独立提交。下面命令是实施阶段的验收命令，本次计划编写不代表已经运行网站测试。

### Task 1：建立内容契约与静态站骨架

**Files:** 创建 `package.json`、`astro.config.mjs`、`tsconfig.json`、`src/content.config.ts`、`src/data/*`、`scripts/validate-content.ts`、`tests/unit/content.test.ts`。

**Interfaces:** 消费本文数据接口；输出 `validateContent(dataset): ValidationIssue[]`，其中 issue 有 `file`、`id`、`message`。输出可运行的 `dev`、`check`、`validate:content`、`test`、`build` 脚本。

- [ ] 编写失败测试：`rejectsMissingSource`、`rejectsDuplicateId`、`rejectsMalformedDate`、`rejectsUnreviewedEmergencyPublication`，断言准确定位字段/条目。
- [ ] 运行 `npm run test -- tests/unit/content.test.ts`，确认针对缺失实现失败。
- [ ] 实现 schema、引用验证及构建前内容检查，先放少量已核查样例；draft 内容不进入公开路由和索引。
- [ ] 运行相同测试、`npm run check` 与 `npm run validate:content`；预期通过，未审核紧急内容仍阻止公开发布构建。
- [ ] 提交 `chore: scaffold static guide and content validation`。

### Task 2：完成六模块内容与页面框架

**Files:** 创建 `src/content/guides/*.mdx`、`src/layouts/BaseLayout.astro`、`src/pages/*`、`src/styles/global.css`、`tests/e2e/reading.spec.ts`。

**Interfaces:** 消费 Task 1 内容集合；输出本文路由表与各页 `data-pagefind-body` 内容区。菜单数据消费 `Recipe[]`；输出可静态阅读的阶段菜单。

- [ ] 编写失败测试：各模块有独立标题、来源和免责声明；禁用 JS 后六模块可读；404 和紧急入口可达。
- [ ] 运行 `npm run test:e2e -- tests/e2e/reading.spec.ts`，确认当前缺失页面失败。
- [ ] 完成所有路由、三阶段全文、妈妈/伴侣行动、三套菜单与医学校正；加入页头及移动端紧急入口和打印样式。
- [ ] 运行同一测试与 `npm run check`；预期无 JS 阅读、键盘导航、移动端入口和菜单内容通过；人工检查 4 种视口无横向溢出。
- [ ] 提交 `feat: add pregnancy guide pages and safety navigation`。

### Task 3：孕周计算与任务推荐

**Files:** 创建 `src/lib/pregnancy.ts`、`src/components/GestationTool.astro`、`tests/unit/pregnancy.test.ts`、`tests/e2e/pregnancy.spec.ts`；修改首页。

**Interfaces:** `calculatePregnancy(input: { lmp?: string; dueDate?: string }, today: string): { ok:true; weeks:number; days:number; stage:'early'|'middle'|'late'; dueDate:string; basis:'lmp'|'doctor' } | { ok:false; code:'invalid-date'|'future-lmp'|'out-of-range'|'missing-input' }`。`getMilestones(gestationalDay:number, items:Milestone[]):Milestone[]`。

- [ ] 编写测试：`lmp=2026-05-01,today=2026-11-07` 输出 `27+1`、中期、预产期 `2027-02-05`；增加 13+6/14+0、27+6/28+0、40+0/42+0 边界、闰日、未来日期、无效日期及医生日期优先。
- [ ] 在 `TZ=Asia/Shanghai` 和 `TZ=America/New_York` 分别运行 `npm run test -- tests/unit/pregnancy.test.ts`，确认缺实现时失败。
- [ ] 实现 UTC 日序号算法、阶段/输入边界、来源说明、最多 3 条关联任务及可选本机记忆开关。
- [ ] 重跑两时区测试和 `npm run test:e2e -- tests/e2e/pregnancy.spec.ts`；验证默认刷新不持久保存，开启后保留，关闭或清除后删除。
- [ ] 提交 `feat: add gestational age tool and weekly tasks`。

### Task 4：食物搜索与条件式结论

**Files:** 创建 `src/lib/food-search.ts`、`src/components/FoodFinder.astro`、`src/pages/food-guide/[slug].astro`、`tests/unit/food-search.test.ts`、`tests/e2e/food.spec.ts`；扩充 `foods.json`。

**Interfaces:** `filterFoods(foods:Food[], filters:{ query:string; category?:string; risk?:FoodRisk }):Food[]`；各筛选项按 AND 组合，query 在 name/aliases/keywords 中匹配，风险匹配任一 preparation。

- [ ] 编写测试：`咖啡` 与别名 `coffee` 命中同条；三文鱼详情区分生/熟；多条件组合、空格、大小写、无命中可预测；不存在的 food slug 返回 404。
- [ ] 运行 `npm run test -- tests/unit/food-search.test.ts`，确认失败。
- [ ] 实现搜索/筛选和详情页，整理约 60 条资料；每个风险结论有条件、理由和出处，不生成来源之外的结论。
- [ ] 运行同一单测、`npm run validate:content` 和 `npm run test:e2e -- tests/e2e/food.spec.ts`，预期搜索、筛选、无结果和键盘操作通过。
- [ ] 提交 `feat: add searchable food safety guide`。

### Task 5：待产清单与本机存储

**Files:** 创建 `src/lib/checklist.ts`、`src/lib/storage.ts`、`src/components/Checklist.astro`、`tests/unit/storage.test.ts`、`tests/e2e/checklist.spec.ts`；完善 `checklist.json`。

**Interfaces:** `loadChecklist(storage:StorageLike|null, validIds:string[]):ChecklistState`；`saveChecklist(storage:StorageLike|null, state:ChecklistState):{ persisted:boolean }`；`resetChecklist(storage:StorageLike|null):void`。StorageLike 只需要 getItem/setItem/removeItem；所有存储异常在内部捕获。

- [ ] 编写测试：勾选与位置恢复；损坏 JSON 回退；未知版本回退并提示；未知 ID 不计入进度；存储拒绝/写满时不抛异常；重置不影响孕周设置。
- [ ] 运行 `npm run test -- tests/unit/storage.test.ts`，确认失败。
- [ ] 实现清单分类、进度、未完成筛选、默认角色、收纳位置、打印和确认重置；不可持久化时显示“本次会话可用，刷新可能丢失”。
- [ ] 运行同一单测及 `npm run test:e2e -- tests/e2e/checklist.spec.ts`，验证刷新、异常存储、打印与无跨设备同步提示。
- [ ] 提交 `feat: add local birth preparation checklist`。

### Task 6：全站中文搜索与无障碍

**Files:** 创建 `src/components/SearchDialog.astro`、`tests/e2e/search.spec.ts`；修改构建脚本、布局和打印/焦点样式。

**Interfaces:** 消费已生成静态 HTML；输出 Pagefind 索引与站内搜索框。所有结果链接通过 Task 7 的 URL 约定保持 base 前缀。

- [ ] 编写失败测试：“咖啡、胎动、破水、待产包”分别命中预期内容；未发布内容不命中；无结果仍有紧急入口；Escape 关闭后焦点回到触发按钮。
- [ ] 运行 `npm run test:e2e -- tests/e2e/search.spec.ts`，确认当前无索引/功能失败。
- [ ] 配置构建后 Pagefind 索引与中文检索；根据实测选择支持中文分词的构建配置。实现可访问的搜索弹层、结果标题/摘要和加载失败提示。
- [ ] 构建后重跑浏览器测试；在无 JS、索引加载失败、键盘操作及 360px 视口复核入口和降级行为。
- [ ] 提交 `feat: add local site search and accessible controls`。

### Task 7：GitHub Pages 部署及子路径验收

**Files:** 创建 `.github/workflows/pages.yml`、`src/lib/urls.ts`、`tests/e2e/deployment.spec.ts`、`README.md`；修改 `astro.config.mjs`。

**Interfaces:** `withBase(path:string, base:string):string` 生成站内路径；`SITE_URL` 为 origin，`BASE_PATH` 默认 `/`，仓库站点为 `/<repo>/`。Astro site/base 与资源、搜索索引遵循同一配置。

- [ ] 编写失败测试：base 为 `/duobump/` 时，从深层详情刷新不丢页面；导航、资源、索引与搜索结果不跳到根站点；404 有恢复入口。
- [ ] 运行 `BASE_PATH=/duobump/ npm run build` 后执行子路径预览测试，确认缺失配置时失败。
- [ ] 实现 Actions：安装 → 类型/内容/单测检查 → 构建 → 浏览器测试 → 上传 artifact → 部署 Pages；限定发布分支、最小权限和部署并发。记录 Node 版本与 lockfile 安装方式。
- [ ] 运行 `npm run check`、`npm run validate:content`、`npm run test`、`npm run build`、`npm run test:e2e` 及子路径测试，全部通过后才可部署。仓库身份和 Pages 设置在实施时由实际环境确定，不预先伪造 URL。
- [ ] 在 README 写明 Pages 开启方式、域名可选项、内容更新、回滚到上一 artifact/提交的流程；提交 `ci: deploy verified static guide to github pages`。

### Task 8：内容审核与上线交接

**Files:** 更新发布内容审核元数据、来源核查记录和 README；创建 `docs/release-checklist.md`。

**Interfaces:** 消费 Task 1 的 reviewStatus 检查和全部测试结果；输出真实的上线验收记录。

- [ ] 由产科/助产专业人员审核就医内容和阶段检查说明；营养内容由适任专业人员审核。没有实际审核人不填虚构姓名，不解除关键内容发布阻断。
- [ ] 按六个模块逐项对照原需求和内容校正表；记录未解决的指南地区差异及最终页面措辞。
- [ ] 在 Android Chrome、iOS Safari 完成真实设备抽查；测量 Lighthouse，记录测试环境、指标、未达标项和修复结果。
- [ ] 在最终发布配置下执行 Task 7 全部检查，留存结果，并验证打印清单、外部来源、隐私清除功能与医疗入口。
- [ ] 更新发布记录并提交 `docs: record reviewed content and release verification`；只有通过医学审核及技术验收才标记可公开发布。

## 八、五天节奏与实际发布门槛

| 时间 | 工作包 | 当天可评审结果 |
| --- | --- | --- |
| Day 1 | Task 1 + Task 2 框架；并行整理来源资料（同一实施者分时推进） | 首页/导航/阶段页样式、内容 schema、校正清单 |
| Day 2 | Task 2 正文 + Task 3 | 六模块初稿、3 套菜单、可演示孕周工具 |
| Day 3 | Task 4 + Task 5 | 约 60 条食物速查、约 30 项持久化清单 |
| Day 4 | Task 6、响应式、数据补全、发起专业审核 | 可完整走通的本地/预览版本、审核材料 |
| Day 5 | Task 7 技术验收 + Task 8 可完成部分 | GitHub Pages 部署配置、测试结果、待审核清单 |

假设一名熟悉该技术栈的开发者、现有资料可用、范围固定；预计约 5～7 个开发工作日，五天是紧凑目标。医学审核受实际审核资源影响，不包含在固定工期承诺内。若时间不足，先减少食物条目数量和视觉装饰，不削减关键内容核查、可读性和就医入口。

GitHub Pages 和开发工作并不自动提供医学审核或本地网络访问质量；发布前实测目标用户网络环境。自定义域名、专业审核与维护投入单独计算，是否收费及额度以实际平台/服务方案为准。

## 九、发布验收与维护

验收应同时满足：

- 六模块全文完整、三阶段窗口明确、来源与免责声明可见。
- 孕周两种输入、阶段边界、日期异常和隐私选择通过测试。
- 食物结论有制备条件，搜索/筛选/无结果状态可用。
- 待产清单刷新恢复、独立清除、存储失效降级与打印通过。
- 紧急页经专业审核，风险行动置顶；没有问卷、固定计数阈值或过度简化的破水处理挡住求助。
- 中文全站搜索可用；详情直接访问、仓库子路径和 404 通过。
- 四种视口、键盘操作、触摸区域、对比度与性能有实测记录。
- 不上传孕期资料/搜索词，不在 URL 或分析请求中暴露日期。
- README 能让另一名维护者更新内容、复验、发布与回滚。

发布后按季度复核来源；重要医疗建议变化及时更新。扩展优先级为：更完整食物库与替换菜单 → 用户明确需要的提醒/导出 → 多设备协作；后两项涉及数据与隐私架构变化，另立需求。

## 十、计划自查结论

六模块覆盖在 Task 2；三个工具覆盖 Task 3～5；中文搜索与无障碍覆盖 Task 6；部署与子路径覆盖 Task 7；免责声明、来源与医学审核覆盖 Task 1 / 2 / 8。Review Focus 五类输入均有所属任务的测试。计划编制时工作区初始为空。用户授权后已完成网站技术预览与自动化验收，真实医学审核和 GitHub Pages 公开部署仍待完成；详见 `docs/release-checklist.md`。

技术核查来源：Astro GitHub Pages 指南 `https://docs.astro.build/en/guides/deploy/github/`；Pagefind 静态搜索与多语言说明 `https://pagefind.app/`、`https://pagefind.app/docs/multilingual/`。实施时复核工具版本和配置。
