# Known Limitations

1. 正式 pnpm 依赖、锁文件、Orval 生成、Vitest/RTL/MSW 与 Vite production build 已在当前环境完成；不再属于阻塞项。
2. Playwright runner 与 7 项 E2E 规格已验证可发现/编译，但 Chromium 二进制下载被当前网络策略返回空包。精确 1920/1600/1440 自动化与 23 张截图仍需在预装或可下载 Chromium 的环境执行。
3. `dist-preview/` 和 Sites 托管构建使用根目录兼容层；正式独立前端构建为 `product/dist/`，两者用途不混淆。
4. Overview、Case、Run Dashboard、Evaluation、Evidence 等核心 Console 接口仍为 NEW 或 EXTEND；默认 Mock/MSW 不冒充 Server 已实现。
5. Score Distribution 与若干 Operational 指标为 `BLOCKED_DATA`，正式算法或上游 Producer 未冻结时必须允许 null/partial。
6. Reports 草稿、Alerts 生命周期为 session-local；Settings 偏好为设备 localStorage。后端持久化 API 未实现，这些边界已在 UI 中明确标注。
7. Candidate、Baseline、Dataset、Profile 为只读 Mock registry projection；不包含创建、编辑、发布或权限管理。
8. Sites 云端浏览器视口为 1363×936；已实际验证 18 条路由无页面横向溢出，并验证三次下钻 Evidence、报告草稿、告警生命周期、设置持久化与资源跳转。
