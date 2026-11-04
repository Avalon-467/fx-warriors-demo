# FX Warriors

A public FX research demo for the AI6101 mini-project. The dashboard combines traditional numerical forecasts with a real, bounded LLM tool-calling agent served by a Cloudflare Worker through Sites.

Public site: https://fx-warriors-lab.cloudlessmarigold1.chatgpt.site

## The agent

1. The server retrieves ECB reference rates, falling back to an explicitly dated snapshot if needed.
2. It computes traditional forecast outputs and injects them into the initial LLM prompt: pair, quote convention, spot/date, drift, volatility, central rate, 80% interval, user scenario and limitations.
3. The LLM issues native `tool_calls`. The server executes an allowlist of tools and sends their outputs back to the model.
4. A structured report shows the numerical anchor, interpretation, source citations, missing evidence and actual tool activity.

| Tool | Output |
| --- | --- |
| `get_traditional_forecast` | The same trusted numerical context used in the initial prompt |
| `compare_traditional_models` | Shrunk drift, no-change and mean-reversion forecasts, plus descriptive rolling historical MAE |
| `get_official_policy_news` | Official Federal Reserve / ECB RSS headlines and summaries, dates, URLs and coverage gaps |
| `present_fx_analysis` | Structured final analysis, accepted only after successful forecast and policy-tool inspection |

The model connection uses the OpenAI-compatible endpoint configured for ClawCrossHub. Credentials are supplied as server runtime secrets. The model name is the provider's configured identifier; the app does not independently verify the underlying model identity. There is no simulated AI fallback. Provider failures, incomplete responses and rate limits are shown explicitly. Incomplete tool arguments can be repaired within a maximum of four model calls per analysis. Each call has a 55-second timeout and a 4,096-token output limit.

## Models and data

The bundled snapshot contains 64 ECB reference observations from 2026-08-06 through 2026-11-03. All currency crosses use the same daily EUR table. Six currencies are available: USD, SGD, EUR, GBP, CNY and JPY.

Source: https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml

Daily drift is 25% of the mean of the latest 20 log returns. Volatility is the sample standard deviation of up to 60 returns. The 80% normal-return interval is uncalibrated. The comparison tool also evaluates no-change and convergence toward the trailing 20-observation mean. The rolling evaluation is short and overlapping, so it does not establish future predictive performance. Dates skip weekends, not all market holidays.

The AI analyst retrieves current ECB history on the server. The forecast desk starts with the bundled snapshot and offers a separate Frankfurter refresh. Their observation dates can differ; the report labels its own date and source mode. RSS evidence covers the Fed and ECB only, and does not retrieve full articles. Unconnected currency feeds and failed retrievals are disclosed. Headlines do not establish the contents of a policy decision.

The separate local scenario lab remains a keyword preview with an editable basis-point assumption. That adjustment is neither estimated by the LLM nor learned from news. The LLM interprets evidence and does not overwrite the classical numerical forecasts.

## Other features

- Five-, ten- and twenty-weekday forecast horizons; selectable crosses and inversion.
- Interactive history/forecast charts and CSV export.
- Fee-aware send/receive budget planning with browser-local saved plans and deletion controls.
- Model methodology, descriptive rolling evaluation and responsive mobile layouts.

## Development and verification

Use Node 22.13 or newer. Install dependencies using the Sites dependency helper. `npm run build` builds the Vinext/Cloudflare application. For hosted preparation, use the Sites `build-site.mjs` and `site-workflow.mjs` helpers.

After building, initialize the local D1 database:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_clumsy_silver_fox.sql
npm start -- --port 4173
```

Tests:

```sh
node tests/core.test.mjs
node tests/agent.test.mjs
node tests/quota.test.mjs
node tests/browser.cjs
node tests/agent-browser.cjs
```

The browser tests use the workspace Playwright installation. Agent browser checks replay a recorded successful real response at `/tmp/fx-real-agent-events.ndjson`; they do not spend API credits. Backend agent tests use mocked provider responses to verify prompt/tool consistency, malformed-report repair, source filtering, evidence requirements and bounded failures. A real provider smoke test and a deployed-route check complement those tests.

Runtime configuration uses Sites environment variables:

| Name | Secret | Purpose |
| --- | --- | --- |
| `FX_LLM_BASE_URL` | Yes | Configured OpenAI-compatible base URL |
| `FX_LLM_API_KEY` | Yes | Provider credential, never exposed to the browser |
| `FX_LLM_MODEL` | Yes | Provider model identifier; displayed by the status endpoint |
| `FX_MAX_DAILY_CALLS` | No | Shared UTC daily provider-call cap, default 60, maximum 120 |

`DB` is a D1 binding for atomic usage counters. The hosted migration is in `drizzle/`; runtime secrets do not belong in source, assets or the hosting manifest. The demo also limits each visitor to six analysis requests per UTC hour. Cancellation stops subsequent model calls and aborts an active fetch where supported; an already-started provider call may still be charged.

## Privacy and publication

Questions, supplied headlines and public numerical context are sent to the configured model provider only when an analysis is started. Saved budget names and amounts stay in browser local storage and are not included. The application stores usage counters with daily hashed caller identifiers, not question or report histories. The model and hosting providers may process request data under their own policies.

The existing public Sites identity is preserved in `.openai/hosting.json`. Source and its matching Worker build are committed, pushed and packaged through the Sites source workflow before publication. Public access was explicitly requested by the user.
