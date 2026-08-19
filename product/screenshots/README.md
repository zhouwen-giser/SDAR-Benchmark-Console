# Screenshot Plan

`scripts/capture-screenshots.mjs` 会生成：

- BLOCKED / READY / INVALID / STALE / PARTIAL Overview（1920×1080）
- Overview 1600×900、1440×900
- Runs、Run Detail、Compare、Evaluation、Evidence Diff（1920×1080）
- Cases、Case Detail、Evaluation / Evidence collections、Analytics、Reports、Alerts、Settings（1920×1080）
- Candidate、Dataset、Profile Detail（1920×1080）

`overview-deployment-v1.jpeg` 是此前 Sites checkpoint 自动生成并下载的真实部署截图（1200×750）。它用于证明发布产物渲染，不替代任务要求的多状态、多视口截图。

运行 `pnpm screenshots` 生成完整集合。本次受限环境的云浏览器已用于视觉验收，但其文件共享挂载为只读，无法把交互过程截图持久化到本目录；交付报告没有把设计参考图冒充为实现截图。
