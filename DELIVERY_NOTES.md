# SDAR Benchmark Console v0.4 交付说明

- 交付日期：2026-08-15
- 源码版本：`9a39d22e0c2eda9ff20d7f43d4bf8bdf136e4db9`
- 在线站点：https://sdar-benchmark-console.cwgis2026.chatgpt.site
- 产品入口：`product/`
- 可直接审阅的静态构建：`product/dist-preview/`

## 本轮完成范围

- 补齐正式 pnpm 基线、锁文件、工作区配置和真实依赖构建链路。
- 将 OpenAPI 扩展至 28 个操作，并通过 Orval 生成 142 个类型模型、React Query 客户端和 Mock 工厂。
- 扩展 MSW 数据与处理器，覆盖 Case、Evaluation、Evidence、Analytics、Reports、Alerts、System 和资源详情页面。
- 在 Cases 中增加 Evaluation 直达动作，形成 Overview → Cases → Evaluation → Evidence Diff 的三次点击核查路径。
- 完善 Reports 草稿预览、Alerts 状态流转、Settings 本地偏好、Candidate / Baseline / Dataset / Profile 详情及 18 条路由的页面功能。

## 质量验证

- `pnpm check` 通过：Orval 生成、21 项 Vitest / RTL / MSW 测试、TypeScript 严格检查和正式 Vite 构建均通过。
- 根级 Sites 构建、制品校验和部署终态确认通过。
- 浏览器验收覆盖 18/18 路由，无页面渲染错误、404 或横向溢出；关键业务流程均完成实际点击验证。
- Playwright 套件已扩展为 7 个场景，并可成功编译和列出测试。

## 环境限制

当前执行环境无法从 Playwright CDN 完整下载 Chromium 二进制，因此未在终端执行 1920×1080、1600×900、1440×900 三档自动化和 23 张截图采集。该限制不影响正式构建、单元/组件/API 合同测试、云端浏览器验收或线上发布；待具备浏览器二进制后可运行 `pnpm test:e2e` 与 `pnpm screenshots` 补齐。

## 运行方式

```bash
cd product
pnpm install
pnpm check
pnpm dev
```

根级 Work Mode 兼容构建可运行：

```bash
npm install
npm test
npm run validate:artifact
```
