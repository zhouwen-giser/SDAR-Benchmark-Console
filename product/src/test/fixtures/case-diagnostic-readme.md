# Ordinary Case fixtures

These are bounded copies of existing Server results, not new executions or expected-score inputs.

- `case-diagnostic-v2.json`: Console proxy GET of Evaluation `operational-evaluation-c9f51fafc9c3a4c6c1cd99ad8d7a9d3cf1c72367da9a845cc9830336df3ae52c`, revision 19, read on 2026-10-09.
- `case-diagnostic-v1.json`: `/home/zhouwen/web-download/sdar-benchmark-server/reports/core001-native-diagnostic-v2.4/case-diagnostic-score.json`, policy/1 historical result.

Scores, coverage, all ten rules, limits, quality and physical summaries are retained. Repeated evidence/source-reference arrays retain at most two entries, and fields retain the first three entries, to keep UI tests small. Live read-only validation checks the unabridged HTTP results separately. Neither fixture is used by the HTTP application or as a fallback.
