# FX Warriors Agent Evaluation — Lightweight Smoke Test

**Date:** 2026-11-19
**Repository revision inspected:** `59dbeb5` (`main`)
**Live model reported by the demo:** `claude-haiku-5-5`

This small, exploratory check supplements the system design; it is not a benchmark or a statistically meaningful estimate of overall accuracy. The four recorded test prompts used synthetic, non-personal content.

## Live agent tests

| Test | Outcome | Prompt tokens | Completion tokens | Total tokens | Model calls |
|---|---|---:|---:|---:|---:|
| USD/SGD 10-weekday forecast vs. no-change baseline | Forecast values, MAEs, reference date, and limitations matched the tool output | 7,729 | 1,209 | 8,938 | 2 |
| Recent official MAS/SGD policy search | Both searches were rate-limited. The agent disclosed that it had no source/date and did not invent a policy summary. Retrieval was not completed. | 11,607 | 1,125 | 12,732 | 3 |
| Chinese EUR/USD 5-weekday forecast | Pair, horizon, reference date, central forecast, interval, and caveats matched trusted model context | 8,103 | 1,840 | 9,943 | 2 |
| Unsupported CAD/SGD forecast | Correctly declined and did not substitute another pair | 3,687 | 786 | 4,473 | 1 |
| **Recorded total / mean per turn** | **Three numerical/boundary checks passed; news retrieval was unavailable** | **31,126 / 7,781.5** | **4,960 / 1,240** | **36,086 / 9,021.5** | **8 / 2** |

Token totals come from the live response `usage` fields and cover only the four recorded turns. Two preliminary UI submissions were not included because their usage fields could not be captured, so total token use for the whole testing session is unknown and higher than the recorded total. The counts exclude search-provider usage and do not estimate monetary cost.

The MAS search returned no sources, so citation correctness could not be evaluated. Its failure was consistent with a temporary Tavily keyless-search rate limit. No overall answer-accuracy percentage should be inferred from these cases.

## Traditional forecast result observed live

For USD/SGD, reference date 2026-11-18, the live 10-weekday forecast returned spot 1.28957, shrunk-drift central rate 1.29112, and an uncalibrated 80% interval of 1.28257–1.29974. On 24 overlapping historical windows, the tool returned MAE 0.00336 for shrunk drift, 0.00295 for no-change, and 0.00280 for mean reversion. This is a short rolling historical comparison, not held-out validation or proof of future accuracy.

The final report's backtest table uses the earlier bundled snapshot through 2026-11-03. These live values use a newer reference date and should not replace the report values without labeling the changed data date and evaluation context.

## Limitations

- Tavily keyless search was rate-limited during the test; repeat later to assess successful source grounding.
- The repository's Node tests were not run because Node.js/npm were unavailable in the test environment; VS Code had no registered test controller for the `.mjs` files.
- The course handout does not require implementation or testing. This is supplementary evidence, not a change to the submitted final report.
