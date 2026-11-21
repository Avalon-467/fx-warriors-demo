# FX Warriors — AI6101 Mini-Project

A student team research demo by the FX Warriors team for the AI6101 mini-project, exploring how conversational AI, web research and traditional FX models work together. Start with a question; the agent can display an exchange-rate chart, compare traditional forecasts, search the web and read cited sources directly in the conversation.

Public site: https://fx-warriors-lab.cloudlessmarigold1.chatgpt.site

## Experience

- The homepage opens to a message box, with optional example questions.
- **Browser-adaptive bilingual UI (`EN` / `中文`)**: automatically detects `navigator.languages` / `navigator.language` (with live `languagechange` support and an instant topbar toggle), and forwards the UI locale preference to `/api/chat`.
- Ask in English or Chinese. Follow-ups carry the recent conversation and current currency pair.
- Charts appear only when requested or selected by the agent. Each point comes from dated reference observations or the traditional model, not an LLM-generated series.
- Web research returns clickable source cards and inline citations. Cards distinguish search excerpts, page excerpts, official feeds and dated caches.
- Expand research activity to inspect actual tool arguments and outputs.
- Stop an answer or start a new chat. Conversations remain in page memory and disappear on reload; saved budget data is separate.
- The forecast desk, scenario lab, budget planner, CSV export and model card remain available in the navigation.

Example requests:

> Show USD/SGD over the last three months.
>
> Search the latest policy affecting EUR/USD and give me sources.
>
> 画一下美元兑日元的走势，再比较未来10天的模型预测。
>
> Read the official statement behind that claim. Sources only, no chart.

## Agent and tools

For each message, the server computes traditional FX outputs and injects them into the initial prompt: pair, reference date, spot, drift, volatility, central rate, model interval and assumptions. The same context is available through a native tool. The LLM decides which additional tools the message requires.

| Tool | Result |
| --- | --- |
| `get_traditional_forecast` | Trusted numerical model output with optional pair/horizon changes, model selection (`shrunk_drift`, `no_change`, `mean_reversion`, `ensemble`), closed-form `include_path`, `±100 bps` sensitivity grid, 20/40/60-day `window_check`, additive move decomposition and 90-day spot percentile |
| `show_fx_chart` | Interactive historical curve, optionally with an illustrative forecast and 80% interval |
| `compare_traditional_models` | Shrunk drift, no-change and mean-reversion forecasts plus descriptive rolling MAE |
| `search_web` | Query-specific Tavily web/news search with URLs, excerpts and available publication dates |
| `read_source` | Bounded page extraction for a source ID already returned during this turn |
| `get_official_policy_news` | Supplementary fixed Fed/ECB RSS evidence, with cache/coverage labels |
| `present_fx_answer` | Concise conversational answer, validated citation IDs and follow-up suggestions |

The chat endpoint is `POST /api/chat`; `GET /api/chat` returns connection status. The older `/api/agent` endpoint remains available for the previous structured report workflow, now with a bounded Tavily `search_news` tool (up to two searches per analysis) alongside the fixed official feeds and a five-round loop. Native `tool_calls` are sent back to the model with real tool outputs. Provider failures remain explicit; no simulated AI or fabricated search response is substituted.

A chat turn has at most six model calls, two searches and two page reads. The model gets up to eight prior user/assistant messages. Current messages and history entries are bounded to 2,000 characters each. Tool names, currency inputs, source IDs and external research endpoints are validated server-side.

## Search

Search and extraction use Tavily's documented [keyless access](https://docs.tavily.com/documentation/keyless), which supports limited demo use without another credential. This is real keyword web search, beyond the fixed central-bank feeds. An optional server-side `FX_SEARCH_API_KEY` switches to an account's limits without a code change. Shared provider limits may temporarily make search unavailable; the response and research activity show the failure. When Tavily fails, both the chat `search_web` and the structured `search_news` tool automatically fall back to the fixed Fed/ECB official RSS (live or dated snapshot) and label the result with `provider: official_rss_fallback`. The fallback cannot cover currencies without a connected feed (for example SGD), so a coverage gap is still disclosed. The structured `/api/agent` report workflow uses the same endpoint through `search_news`, capped at two searches per analysis.

Search requests send focused research queries. Page reads accept only HTTPS source URLs returned by a research tool in the same turn. The Worker calls the fixed Tavily API rather than exposing a general-purpose fetch proxy. Source text is treated as untrusted evidence, never as instructions. Search excerpts are not claimed as full-page verification; extracted content is capped at 8,000 characters.

## Models and data

Supported currencies: USD, SGD, EUR, GBP, CNY and JPY. The server fetches ECB reference history and falls back to a labelled snapshot of 64 observations from 2026-08-06 through 2026-11-03. All cross rates use the same daily EUR table.

Source: https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml

Daily drift is 25% of the mean of the latest 20 log returns. Volatility is the sample standard deviation of up to 60 returns. The 80% normal-return interval is uncalibrated. Mean reversion converges toward the trailing 20-observation mean. The short, overlapping rolling evaluation does not establish future predictive performance. Forecasts cover 5, 10 or 20 weekdays and skip weekends, not all market holidays. Available history is about 90 calendar days.

The forecast desk initially uses the bundled snapshot and offers a Frankfurter refresh; chat retrieves data on the server and labels its own reference date. Their dates may differ. The local scenario lab remains an editable keyword-based hypothetical adjustment. Neither that adjustment nor the quantitative forecast is learned from LLM news interpretation.

Fixed Fed/ECB feeds remain a supplementary tool. If those feeds fail, official RSS captured on 2026-11-04 is used with an explicit cache notice. The web-search tool can find sources beyond those feeds, including other central banks. Missing evidence and retrieval failures are disclosed.

## AI6101 Responsible AI alignment

See [FX-Warriors-final-report.docx](FX-Warriors-final-report.docx) (coursework submission format, A4 Arial 10pt), [FX-Warriors-final-report.pdf](FX-Warriors-final-report.pdf) (6-page PDF preview), [docs/AI6101-system-design.md](docs/AI6101-system-design.md), and [docs/agent-evaluation.md](docs/agent-evaluation.md) (live smoke-test log) for the complete system design and evaluation mapped to the AI6101 Introduction to AI and AI Ethics coursework specification across all three Responsible AI Practices:

1. **Explainability & interpretability**: closed-form projection formulas, rolling historical baseline comparison, inspectable tool calls, and inline `[sN]` provenance cards.
2. **Fairness & equal access**: symmetric EUR cross-rate calculation across all six currencies, explicit disclosure of central-bank RSS coverage gaps, two-sided pair search guidance, and browser-adaptive English/Chinese parity.
3. **Privacy preservation**: browser-local `localStorage` budget planning, ephemeral in-memory chat, and daily-salted SHA-256 hashed rate limiting.

## Development

Use Node 22.13 or newer and the supplied Sites dependency/build workflow. The application uses Vinext and Cloudflare Workers; the source hosting manifest preserves the existing public Site and its D1 binding.

After building, initialize the local D1 database once:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_clumsy_silver_fox.sql
npm start -- --port 4173
```

Tests:

```sh
node tests/core.test.mjs
node tests/agent.test.mjs
node tests/chat.test.mjs
node tests/forecast-tool.test.mjs
node tests/quota.test.mjs
node tests/i18n.test.mjs
node tests/browser.cjs
node tests/chat-browser.cjs
node tests/i18n-browser.mjs
```

Browser tests use the workspace Playwright installation. Chat UI tests replay a recorded successful real response at `/tmp/fx-chat-real-events.ndjson` to verify rendering without spending model credits. Backend fixtures check model/context consistency, dynamic chart/search decisions, follow-up history, source extraction, citation filtering, input bounds, network targets and failures. Real provider and public Cloudflare smoke tests complement those checks.

## Runtime configuration and privacy

| Variable | Secret | Purpose |
| --- | --- | --- |
| `FX_LLM_BASE_URL` | Yes | ClawCrossHub's configured OpenAI-compatible endpoint |
| `FX_LLM_API_KEY` | Yes | Provider credential; server-only |
| `FX_LLM_MODEL` | Yes | Configured model identifier; it can be returned by the status endpoint |
| `FX_SEARCH_API_KEY` | Yes, optional | Tavily API credential; omitted for keyless demo access |
| `FX_MAX_DAILY_CALLS` | No | Shared UTC daily model-call cap, default 60 and maximum 120 |

### Configuring the search credential

`FX_SEARCH_API_KEY` is optional. Without it, the demo uses Tavily keyless access, which has shared provider limits.

For local development, create a `.dev.vars` file in the project root (already covered by the `.env*` / `.dev.vars*` ignore rules):

```text
FX_SEARCH_API_KEY=your_tavily_key
```

For production, add `FX_SEARCH_API_KEY` as a Secret in Cloudflare Dashboard → Workers & Pages → Settings → Variables and Secrets, then redeploy.

Never hardcode the key in source files, client assets, `wrangler.toml`, or committed configuration. Revoke and rotate the key immediately if it is exposed. Replacing the key requires no code change.

The app also limits chat to twelve requests per visitor per UTC hour and sixty search/extraction calls per UTC day. D1 stores atomic counters with daily hashed caller identifiers, not conversations or reports. Requests count toward limits even if their provider subsequently fails. A provider call already started may still be charged after cancellation.

Messages, recent conversation context and public numerical data go to the configured LLM. Research queries and selected source URLs go to Tavily. Saved budget names and amounts are not included. Hosting and model/search providers process request data under their own policies. No API keys are included in browser assets or source control.

Publication uses the existing Sites source workflow: build, commit, push and package matching source/output, then save and deploy to the same public URL.
