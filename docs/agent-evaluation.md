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

## Test prompts and verification steps

Each recorded case used a fresh chat with empty history and no personal budget data. The default pair context was USD/SGD, 10 weekdays, and 0 bps. The Chinese case requested Chinese output and explicitly changed the pair and horizon. Token totals are calculated per case as `prompt_tokens + completion_tokens`, summing the provider usage across all model rounds; `model_calls` is the number of rounds returned by the agent.

1. **Numerical forecast and model comparison**
   - Prompt: `Compare the 10-day USD/SGD forecast with the no-change baseline. State the reference date and uncertainty caveat.`
   - Intermediate tool step: `compare_traditional_models` returned one result with 24 overlapping historical windows.
   - Reference checks: spot `1.2895696572`; drift central `1.2911249930`; uncalibrated interval `1.2825691067–1.2997379547`. MAE: no-change `0.0029526001`, shrunk drift `0.0033647400`, mean reversion `0.0028041335`.
   - Outcome: the answer matched the numerical output, identified the reference date as 2026-11-18, and stated the short-sample and interval limitations.
   - Usage: `7,729 + 1,209 = 8,938` tokens; 2 model calls.

2. **Current official policy search**
   - Prompt: `Search for a recent official MAS statement relevant to SGD and summarize only what the cited source supports. Include the publication date and source.`
   - Intermediate tool steps: `search_web` was called twice; both returned `Web search is temporarily rate limited. Please try again later.` The final result had no sources.
   - Outcome: retrieval was not completed. The answer explicitly said it had no MAS source or publication date, made no policy claim, and separated the trusted FX model context from news evidence.
   - Usage: `11,607 + 1,125 = 12,732` tokens; 3 model calls. No citation-quality score is applicable because no source was returned.

3. **Chinese forecast and uncertainty**
   - Prompt: `请用中文说明 EUR/USD 的未来 5 个工作日预测、参考日期，以及 80% 区间有什么限制。`
   - Intermediate tool step: `get_traditional_forecast` returned EUR/USD, 5 weekdays, reference date 2026-11-18, spot about `1.0968`, central `1.0951585691`, and interval `1.0852699298–1.1051373107`.
   - Outcome: the answer used Chinese, gave the 2026-11-25 target date and matching model values, and explained that the interval was uncalibrated. No news source was claimed.
   - Usage: `8,103 + 1,840 = 9,943` tokens; 2 model calls.

4. **Unsupported currency guardrail**
   - Prompt: `What is the 10-day CAD/SGD forecast? Do not substitute another pair.`
   - Intermediate tool step: no forecast or research tool was called; the model answered from the supported-currency boundary.
   - Outcome: the answer declined to forecast CAD/SGD, listed the supported currencies, and did not substitute another pair.
   - Usage: `3,687 + 786 = 4,473` tokens; 1 model call.

The existing implementation already accumulates and returns provider token usage in [`lib/fx-chat.mjs`](../lib/fx-chat.mjs). Numerical forecasts and rolling backtests are implemented in [`public/core.mjs`](../public/core.mjs), and model comparison is in [`lib/fx-tools.mjs`](../lib/fx-tools.mjs). No source code was changed for this evaluation.

Token totals come from the live response `usage` fields and cover only the four recorded turns. Two preliminary UI submissions were not included because their usage fields could not be captured, so total token use for the whole testing session is unknown and higher than the recorded total. The counts exclude search-provider usage and do not estimate monetary cost.

The MAS search returned no sources, so citation correctness could not be evaluated. Its failure was consistent with a temporary Tavily keyless-search rate limit. No overall answer-accuracy percentage should be inferred from these cases.

## Traditional forecast result observed live

For USD/SGD, reference date 2026-11-18, the live 10-weekday forecast returned spot 1.28957, shrunk-drift central rate 1.29112, and an uncalibrated 80% interval of 1.28257–1.29974. On 24 overlapping historical windows, the tool returned MAE 0.00336 for shrunk drift, 0.00295 for no-change, and 0.00280 for mean reversion. This is a short rolling historical comparison, not held-out validation or proof of future accuracy.

The final report's backtest table uses the earlier bundled snapshot through 2026-11-03. These live values use a newer reference date and should not replace the report values without labeling the changed data date and evaluation context.

## Limitations

- Tavily keyless search was rate-limited during the test; repeat later to assess successful source grounding.
- The repository's Node tests were not run because Node.js/npm were unavailable in the test environment; VS Code had no registered test controller for the `.mjs` files.
- With Node.js available, the focused repository checks are `node tests/core.test.mjs`, `node tests/agent.test.mjs`, and `node tests/chat.test.mjs`.
- The course handout does not require implementation or testing. This is supplementary evidence, not a change to the submitted final report.
