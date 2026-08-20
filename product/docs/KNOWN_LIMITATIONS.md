# Known Limitations

1. 当前联调机的 ClickHouse `127.0.0.1:8123` 不可达；Benchmark Server `/ready`、Overview 和依赖分析投影的端点会真实返回 503。Console 保持 PARTIAL/UNAVAILABLE，不回退 Mock。
2. 已迁移的 PostgreSQL 没有正式 Run/Evaluation/Evidence/Report/Attention 业务记录，因此无法在本环境完成动态首条 ID 的数据级全链路、真实报告生命周期与 Attention 状态变更验收。
3. Score Distribution 与若干 Operational 指标在正式统计量缺失时保留 null/partial，不用 0 或 PASS 冒充。
4. 原始 Telemetry Trace 是外部诊断来源，不是不可变 Benchmark authority；Console 只提供外链。
5. 本次完成表示内网 HTTP 接口、视图模型、代理与降级语义已接通，不表示正式 release、80 Case Dataset、F/HG/M 规则冻结、三次 Baseline 或生产安全已完成。
6. v0.1 可信研发网边界不包含登录、TLS、RBAC、SSO、CSRF、Rate Limit 或 IP allowlist。
