# Accessibility Review

## 已实现

- 交互 Section 使用 `role=button`、`tabIndex=0`，支持 Enter 与 Space。
- 图表提供 ECharts ARIA；数据不只用颜色表达，关键状态同时有文本、数字和图标。
- 所有图标按钮有 `aria-label`；导航、筛选器和状态区域有可读名称。
- 键盘可完成 Overview → Case → Evaluation → Evidence 主流程。
- Focus 使用高对比蓝色轮廓；错误、警告、成功颜色在深色背景上同时配有文字。
- 1440 以下显示桌面宽度提示且无横向页面溢出。

## 后续自动化

正式依赖下的 RTL 可访问名称与键盘交互断言已通过；Playwright 规格也已可发现/编译。后续仍需在可运行 Chromium 的环境增加 axe-core 扫描，并人工复核真实 AntD Drawer 焦点圈定、Esc 关闭、Tooltip 键盘触发与屏幕阅读器图表摘要。Sites 兼容层的浏览器结果不替代真实 AntD 的完整无障碍结论。
