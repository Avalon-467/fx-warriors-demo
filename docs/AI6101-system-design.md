# AI6101 Mini-Project System Design Document — FX Warriors

> **Course**: AI6101 Introduction to AI and AI Ethics (CCDS, Nanyang Technological University)  
> **Instructor**: Assoc. Prof. Yu Han (`han.yu@ntu.edu.sg`)  
> **Team**: FX Warriors  
> **Contributors**: `Xinyuan Hou (@Avalon-467)`, `Chi Zhanhua (@QwQZZZZZ)`, `Yuanzhi (@YuanzhiLuk)`, `何宬熠 (@believer-hcy)` *(confirm `@e.ntu.edu.sg` member emails inside `FX-Warriors-final-report.docx` before sending)*  
> **Live Demo**: `https://fx-warriors-lab.cloudlessmarigold1.chatgpt.site`

---

## i) Introduction

Cross-border payments—such as overseas university tuition, rent, remittances, and small-business invoices—expose ordinary individuals to foreign-exchange (FX) volatility. Yet existing consumer tools suffer from three practical flaws:

1. **Opaque or uncalibrated forecasts**: Financial apps often display black-box price targets without stating horizon assumptions, uncertainty ranges, or historical error against a simple no-change baseline.
2. **Hallucination & overconfidence in general-purpose AI chatbots**: When asked about exchange rates or central-bank news, unconstrained LLMs frequently invent exchange rates, fabricate citations, or issue reckless buy/sell directives.
3. **Privacy & linguistic barriers**: Entering personal payment amounts alongside currency questions into third-party AI chats leaks sensitive financial context, while English-only financial dashboards exclude non-native speakers from understanding model limitations.

**FX Warriors** addresses this real-world problem by designing and implementing a **grounded, responsible, bilingual FX research and budgeting assistant** that pairs transparent classical statistical forecasting with a bounded tool-calling LLM research agent and strictly local budget computation.

---

## ii) Application Description

The application is implemented as a lightweight Cloudflare Workers / Vinext web app with five integrated views (`site/index.html`, `public/app.mjs`, `public/agent-ui.mjs`):

1. **Research Chat (`#agent`, default landing view)**  
   A conversational research assistant supporting English and Simplified Chinese (`EN` / `中文`). Users ask questions about supported currency pairs (`USD`, `SGD`, `EUR`, `GBP`, `CNY`, `JPY`) over 5-, 10-, or 20-weekday horizons. The assistant renders interactive inline SVG charts (`public/chat-chart.mjs`), clickable source cards with provenance scopes, inline `[n]` citations, and an expandable **Research activity** trace showing exact tool calls, arguments, and outputs.
2. **Forecast Desk (`#desk`)**  
   A visual currency dashboard featuring a 5-pair watchlist, interactive history (`1M`, `3M`, `All`) + model projection chart with 80% volatility interval, Forecast Lens metrics (recent drift, annualised volatility, scenario adjustment), CSV export, and live Frankfurter/ECB rate refresh with dated snapshot fallback.
3. **Signals Lab (`#signals`)**  
   A transparent, non-LLM keyword scenario sandbox where users test how a policy or macro headline could shift the terminal rate (`±100 bps`), inspect matched keywords and negation handling, adjust the slider manually, or hand off the headline to the Research Chat agent for live source verification.
4. **Budget Planner (`#budget`)**  
   A strictly client-side payment calculator supporting both *"amount to send"* and *"target amount to receive"* modes with percentage and fixed fees. Scenarios can be saved, loaded, and deleted exclusively inside browser `localStorage`.
5. **Behind the Forecast (`#method`)**  
   An interactive **Model Card** exposing exact projection equations, rolling historical backtest metrics (`Model MAE`, `No-change baseline MAE`, `Direction accuracy`, `80% interval coverage`), privacy controls, and an explicit **AI6101 Responsible AI Practices** breakdown.

### Browser-Adaptive Bilingual Experience (`public/i18n.mjs`)

- Automatically detects the visitor's browser language preference (`navigator.languages` / `navigator.language`, prioritizing `zh*` vs. `en*`, and responding to browser `languagechange` events).
- Translates all navigation, charts, model explanations, sample scenarios, tool traces, and error notices into Simplified Chinese (`zh-CN`) or English (`en`), while offering an instant `中文` / `EN` topbar toggle.
- Forwards the active UI locale (`locale: 'en' | 'zh'`) to `POST /api/chat` as `preferred_ui_language` so even language-neutral queries (e.g., `"USD/SGD"`) respond in the visitor's preferred language.

---

## iii) Use of AI Technologies

Rather than using an opaque end-to-end LLM for everything, FX Warriors deliberately separates **numerical forecasting** (classical statistics), **keyword scenario screening** (deterministic rules), and **evidence synthesis** (bounded tool-calling LLM agent):

```text
Browser UI (site/index.html + public/app.mjs + agent-ui.mjs + i18n.mjs)
   │
   ├── Local Deterministic Modules (No LLM / No Server Leakage)
   │     ├── public/core.mjs: EUR cross-rate projection, 80% interval, rolling backtest, budget math
   │     └── public/core.mjs (analyse): Rule-based EN/ZH keyword & negation classifier
   │
   └── POST /api/chat (app/api/chat/route.ts) ──► D1 Atomic Quota (lib/fx-quota.ts)
         │
         ▼
   Conversational Agent Loop (lib/fx-chat.mjs :: runFxChat)
     ├── Server pre-computes ECB 90d rates + shrunk-drift model context & injects into prompt
     ├── Calls OpenAI-compatible Chat Completions API (max 6 rounds, temperature 0.2)
     └── Executes 7 validated native tools:
           1. get_traditional_forecast   (lib/fx-tools.mjs :: forecastExtras multi-model, path, sensitivity, window check, move decomposition)
           2. show_fx_chart              (makeChart -> inline SVG via chat-chart.mjs)
           3. compare_traditional_models (No-change vs. Shrunk drift vs. Mean reversion)
           4. search_web                 (Tavily Search API, max 2/turn, SSRF-checked URLs, official RSS fallback on failure)
           5. read_source                (Tavily Extract API, max 2/turn, registered IDs only)
           6. get_official_policy_news   (Fed/ECB RSS + dated snapshot fallback)
           7. present_fx_answer          (Citation validation + follow-up generation)
```

*(A legacy structured report agent remains available at `POST /api/agent` → `lib/fx-agent.mjs` with a 5-round loop, a bounded Tavily `search_news` step with automatic official RSS fallback, and strict tool-order enforcement before `present_fx_analysis`.)*

### Quantitative & Hybrid AI Techniques Used

| Component | Technique | Purpose & Design Rationale |
| --- | --- | --- |
| **Classical FX Baseline** (`public/core.mjs`) | Log-return shrunk drift (`0.25 × mean(20d)`) + sample std dev (`≤ 60d`) + uncalibrated 80% normal interval | Prevents LLM numerical hallucination; grounds forecasts in reproducible closed-form math. |
| **Model & Tool Extensions** (`lib/fx-tools.mjs`) | Rolling comparison + `forecastExtras` (`no_change`, `mean_reversion`, `ensemble`, `±100 bps` sensitivity grid, 20/40/60d window check, additive move decomposition) | Evaluates baseline errors without auto-selecting a winner; exposes parameter sensitivity and `changed_from` overrides. |
| **Signals Classifier** (`public/core.mjs`) | Rule-based bilingual keyword + negation regex matcher (`±35 bps` preset) | Keeps hypothetical headline exploration deterministic, fast, zero-cost, and inspectable. |
| **Conversational Research Agent** (`lib/fx-chat.mjs`) | Native OpenAI function-calling loop (max 6 rounds) with tool-order & citation validation | Orchestrates chart plotting, model comparisons, and live Tavily web/news extraction only when needed. |

---

## iv) Responsible AI Practices Addressed (AI6101 Core + Bonus Alignment)

FX Warriors explicitly implements **all three** Responsible AI Practices emphasized in AI6101:

### 1. Explainability / Interpretability

- **Transparent mathematical baseline**: Exact projection and interval formulas are shown on the Model Card (`#method`), and historical observations are visually separated from dashed model projections (`chat-chart.mjs`, `app.mjs`).
- **Inspectable agent reasoning**: Every tool call (`show_fx_chart`, `search_web`, `read_source`, `compare_traditional_models`) is streamed and logged in the collapsible **Research activity** panel with exact arguments, durations, and JSON outputs.
- **Grounded citations & provenance labels**: Server-side citation filtering strips any `[sN]` ID not returned by a tool in the same turn, while UI source cards explicitly distinguish *Search excerpt*, *Page excerpt read*, *Official feed*, and *Cached official feed* (`lib/policy-snapshot.json`).
- **No false certainty**: The agent system prompt forbids inventing rates, accuracy percentages, or buy/sell directives, and warns that the 80% interval is uncalibrated.

### 2. Fairness & Equal Access

- **Symmetric cross-currency treatment**: All six currencies (`USD`, `SGD`, `EUR`, `GBP`, `CNY`, `JPY`) are derived identically from a single neutral ECB EUR reference table (`seriesFor`), avoiding arbitrary pair-specific distortions.
- **Explicit coverage-gap & anti-bias disclosure**: Because the built-in official RSS tool covers only Federal Reserve (`USD`) and ECB (`EUR`), `getPolicyNews()` explicitly surfaces coverage gaps for `SGD`, `GBP`, `CNY`, and `JPY`, and the agent prompt instructs `search_web` to investigate **both sides of a currency pair** so non-US/EUR currencies are not systematically under-represented.
- **Linguistic fairness (EN / 中文)**: Browser-adaptive automatic language detection (`public/i18n.mjs`) ensures Chinese-speaking and English-speaking users have equal comprehension of model limitations, data notices, and financial risk disclaimers.
- **Retail fee transparency**: Budget Planner clearly separates official reference rates from provider spreads and fees so ordinary users (e.g., students paying tuition) are not misled by idealized mid-market figures.

### 3. Privacy Preservation

- **Local-only sensitive financial data**: Entered budget amounts, scenario names, and fee structures in Budget Planner reside strictly in browser `localStorage` (`fx-warriors-budgets-v1`) and are **never transmitted** to `/api/chat`, `/api/agent`, the LLM provider, or Tavily. Users can delete individual entries or wipe all browser storage at any time.
- **Ephemeral conversation state & zero chat logging**: Conversations remain in client page memory and disappear on reload; the server database (`fx_usage_counters` in Cloudflare D1) stores only atomic usage counts.
- **Daily-salted hashed rate limiting**: Visitor hourly caps (`lib/fx-quota.ts :: callerHash`) compute a truncated SHA-256 digest of `'fx-demo:' + UTC_DAY + ':' + identity`, rotating daily so raw IP addresses and user IDs are never persisted.
- **Credential & injection isolation**: `FX_LLM_API_KEY` stays server-only and is never sent to Tavily/ECB/RSS endpoints (`tests/chat.test.mjs` verifies credential isolation); retrieved web content is framed as untrusted data and restricted to validated public HTTPS URLs (`publicUrl`).

---

## Coursework Report Checklist (Deliverable Reminder)

Per the AI6101 Mini-Project handout:
- **Length & Format**: No more than **10 pages** (A4, Arial 10pt, reasonable margins, including figures, tables, and references).
- **Filename**: `<team name>-final-report.docx` (e.g., `FX-Warriors-final-report.docx`; PDF edition also tracked at `FX-Warriors-final-report.pdf`).
- **Required Header Info**: Team name, all team members' names, and email addresses.
- **Submission**: Email to `han.yu@ntu.edu.sg` by the end of Week 14.
- **Verification**: Covered by 6 Node unit suites (`tests/core.test.mjs`, `tests/agent.test.mjs`, `tests/chat.test.mjs`, `tests/forecast-tool.test.mjs`, `tests/quota.test.mjs`, `tests/i18n.test.mjs`), 3 Playwright browser suites, and supplementary live smoke testing in [docs/agent-evaluation.md](agent-evaluation.md).
