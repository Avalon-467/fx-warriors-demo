const LANG_STORAGE = 'fx-warriors-lang-v1';

export function detectBrowserLanguage(languages, fallback = 'en') {
  const list = Array.isArray(languages)
    ? languages
    : typeof languages === 'string'
      ? [languages]
      : [];
  const candidates = list.length ? list : [fallback];
  for (const raw of candidates) {
    const tag = String(raw || '').trim().toLowerCase();
    if (!tag) continue;
    if (tag === 'zh' || tag.startsWith('zh-') || tag.startsWith('zh_')) return 'zh';
    if (tag === 'en' || tag.startsWith('en-') || tag.startsWith('en_')) return 'en';
  }
  return 'en';
}

export function getBrowserDefaultLang() {
  if (typeof navigator === 'undefined') return 'en';
  return detectBrowserLanguage(navigator.languages?.length ? navigator.languages : [navigator.language || 'en']);
}

function readStoredLang() {
  try {
    const val = localStorage.getItem(LANG_STORAGE);
    return val === 'zh' || val === 'en' ? val : null;
  } catch {
    return null;
  }
}

let currentLang = readStoredLang() || getBrowserDefaultLang();
const listeners = new Set();

export function getLang() {
  return currentLang;
}

export function onLangChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setLang(next, { persist = true } = {}) {
  const normalized = next === 'zh' ? 'zh' : 'en';
  if (persist) {
    try {
      if (normalized === getBrowserDefaultLang()) localStorage.removeItem(LANG_STORAGE);
      else localStorage.setItem(LANG_STORAGE, normalized);
    } catch {
      // Ignore storage failures in restricted contexts.
    }
  }
  if (currentLang === normalized) return currentLang;
  currentLang = normalized;
  for (const listener of listeners) {
    try {
      listener(currentLang);
    } catch (error) {
      console.error(error);
    }
  }
  return currentLang;
}

export function toggleLang() {
  return setLang(currentLang === 'zh' ? 'en' : 'zh', { persist: true });
}

let initialized = false;
export function initAutoLanguage() {
  if (initialized || typeof window === 'undefined') return currentLang;
  initialized = true;
  currentLang = readStoredLang() || getBrowserDefaultLang();
  window.addEventListener('languagechange', () => {
    if (!readStoredLang()) {
      setLang(getBrowserDefaultLang(), { persist: false });
    }
  });
  return currentLang;
}

export const STRINGS = {
  en: {
    htmlLang: 'en',
    metaDescription: 'An AI6101 student team project combining conversational AI, web research and traditional FX models.',
    skipToContent: 'Skip to content',
    brandHomeAria: 'FX Warriors home',
    brandSub: 'AI6101 STUDENT PROJECT',
    navLabel: 'WORKSPACE',
    nav: {
      agent: 'Research chat',
      desk: 'Forecast desk',
      signals: 'Signals lab',
      budget: 'Budget planner',
      method: 'Behind the forecast',
    },
    sidebarNoteTitle: 'Clarity is your edge.',
    sidebarNoteBody: 'Know the data.<br>Question the forecast.<br>Make an informed move.',
    sidebarNoteLink: 'Explore our approach',
    projectTagTitle: 'AI6101 Mini-Project',
    projectTagSub: 'By the FX Warriors team',
    workspaceLabel: 'Workspace',
    langToggleLabel: '中文',
    langToggleAria: 'Switch language to Chinese (自动语言：当前英文)',
    langToggleTitle: 'Switch to 中文 (Auto-detected from browser)',
    infoButtonAria: 'About this demo',
    teamAria: 'FX Warriors team',
    titles: {
      desk: 'Forecast Desk',
      agent: 'Research Chat',
      signals: 'Signals Lab',
      budget: 'Budget Planner',
      method: 'Behind the Forecast',
    },
    titleSuffix: ' — FX Warriors · AI6101 Mini-Project',
    status: {
      loadingRef: 'Loading reference data',
      refreshedRef: 'Refreshed reference data',
      snapshotPrefix: 'ECB snapshot · {date}',
      refUnavailable: 'Reference data unavailable',
      loadingEllipsis: 'Loading…',
      loadingForecast: 'Loading forecast…',
      loadingDataProvenance: 'Loading data provenance…',
    },
    desk: {
      eyebrow: 'A CLEARER VIEW OF CURRENCY',
      title: 'Forecast desk',
      subtitle: 'Explore the movement. Understand the possibilities.',
      refresh: 'Refresh rates',
      refreshAria: 'Refresh reference rates',
      export: 'Export forecast',
      exportAria: 'Export forecast CSV',
      watchlistAria: 'Currency watchlist',
      viewPairAria: 'View {base} to {quote}',
      sectionOutlook: 'CURRENCY OUTLOOK',
      baseAria: 'Base currency',
      swapAria: 'Swap base and quote currencies',
      quoteAria: 'Quote currency',
      rangeAria: 'History range',
      range1M: '1M',
      range3M: '3M',
      rangeAll: 'All',
      chartAria: 'Historical exchange rate and illustrative forecast',
      rateDescDefault: 'quote currency per 1 base currency',
      rateDesc: '{quote} per 1 {base} · Daily reference rate',
      lastSession: '{pct} last session',
      legendHistory: 'Reference history',
      legendProjection: 'Model projection',
      legendInterval: '80% model interval',
      asOf: 'As of {date} {year}',
      chartTitle: '{base}/{quote} history and {horizon}-day illustrative projection',
      chartDesc: 'Last rate {spot}. Projected central rate {center}. 80 percent model interval {lower} to {upper}.',
      tooltipProjection: 'Projection',
      tooltipReference: 'Reference rate',
      forecastLens: 'Forecast lens',
      illustrativeModel: 'ILLUSTRATIVE MODEL',
      horizonLabel: 'Forecast horizon',
      days5: '5 days',
      days10: '10 days',
      days20: '20 days',
      forecastDesc: '{pct} projected over {horizon} weekdays',
      intervalLabel: '80% model interval',
      intervalTooltip: 'A mathematical interval based on recent volatility, not a validated probability guarantee.',
      recentTrend: 'Recent trend',
      upwardDrift: '↗ Upward drift',
      downwardDrift: '↘ Downward drift',
      annualisedVol: 'Annualised volatility',
      scenarioAdjustment: 'Scenario adjustment',
      none: 'None',
      footnoteDefault: 'A transparent baseline, built from historical daily rates.',
      footnotePlain: 'Based on recent daily changes. The interval is an uncalibrated model estimate.',
      footnoteScenario: 'Includes an assumed {pct} terminal impact. This is a scenario, not an estimated news effect.',
      understandForecast: 'Understand this forecast',
      scenarioTitle: 'What could move the market?',
      scenarioSubtitle: 'Explore hypothetical events, one assumption at a time.',
      openLab: 'Open lab',
      hypotheticalEvent: 'Hypothetical event',
      exploreScenario: 'EXPLORE SCENARIO',
      quickTitle: 'Your currency, in context',
      quickSubtitle: 'A simple amount. A more useful forecast.',
      youExchange: 'You exchange ',
      atRefRate: 'At the reference rate',
      atProjRate: 'At the projected rate',
      enterValidAmount: 'Enter a valid amount',
      planExchange: 'Plan your exchange',
      teaserQuestion: 'Have a question about this pair?',
      teaserAction: 'Open research chat',
      footerSourceDefault: 'Daily reference rates · Illustrative forecasts · Not investment advice',
      footerSourceData: 'Data: {date} · Illustrative forecasts · Not investment advice',
      toastExported: 'Forecast exported with dates and model assumptions.',
      toastRefreshed: 'Reference data refreshed through {date}.',
      toastRefreshFallback: 'Rate service unavailable. Using the verified ECB snapshot through {date}.',
      toastSnapshotError: 'Unable to load the reference data. Please reload.',
      reloadPrompt: 'Please reload the page to retry.',
      dataDetail: '{count} observations · {start} to {end} · {source}',
      sourceFrankfurter: 'Fetched from Frankfurter',
      sourceSnapshot: 'Bundled ECB snapshot',
    },
    signals: {
      eyebrow: 'NEWS → ASSUMPTIONS → SCENARIOS',
      title: 'Signals lab',
      subtitle: 'See how a headline could change the outlook.',
      tag: 'Hypothetical scenario workspace',
      bringTitle: 'Bring a headline',
      bringSubtitle: 'Paste text or start with a sample. The keyword classifier proposes a scenario for you to review.',
      headlineLabel: 'News headline or policy note',
      headlinePlaceholder: 'e.g. The Federal Reserve signals higher interest rates for longer.',
      currencyLabel: 'Currency affected',
      analyseBtn: 'Preview keywords',
      researchHeadlineBtn: 'Research this headline',
      researchPromptPrefix: 'Investigate this unverified headline and find supporting or conflicting sources: ',
      samplesLabel: 'TRY A HYPOTHETICAL EVENT',
      infoNote: 'This demo uses a small keyword classifier, not a trained language model. It does not verify news or infer causal effects. Review and adjust every assumption.',
      resultTitle: 'Scenario interpretation',
      awaitingInput: 'Awaiting input',
      keywordStatus: 'Keyword interpretation',
      manualStatus: 'Manual assumption',
      defaultLabel: 'A headline is a starting point.',
      defaultExplanation: 'Add an event to explore an illustrative impact on the selected currency pair.',
      manualLabel: 'Your own scenario.',
      manualExplanation: 'This impact is set by you. It is not a prediction of how the market will react.',
      impactLabelPrefix: 'Assumed impact on ',
      impactLabelSuffix: ' at the horizon',
      bpsUnit: 'basis points',
      sliderMin: '−1.00%',
      sliderZero: 'No change',
      sliderMax: '+1.00%',
      applyBtn: 'Apply to forecast',
      clearBtn: 'Reset scenario',
      toastNeedHeadline: 'Add a headline or choose a sample first.',
      toastApplied: 'Scenario applied: {bps} bps at the forecast horizon.',
      toastCleared: 'Scenario cleared. The forecast uses historical data only.',
      explainOutside: 'The selected currency is outside {base}/{quote}. Choose a currency in the pair or explicitly set a pair-level assumption.',
      explainNegated: 'The text contains a negation or uncertainty cue. The demo leaves the impact at zero; review the context before setting an assumption.',
      explainClassified: 'Matched wording suggests a possible {dir} scenario for {currency}. The initial ±35 bps is an illustrative preset, not a learned estimate.',
      explainSupportive: 'supportive',
      explainNegative: 'negative',
      explainNone: 'The demo has no clear directional interpretation. You can still choose an explicit assumption with the slider below.',
      labelOutside: 'Currency is outside this pair',
      labelNeedsReview: 'Context needs a human review',
      labelNoSignal: 'No clear keyword signal',
      labelMixed: 'Mixed directional signals',
      labelSupport: 'Possible support for {currency}',
      labelPressure: 'Possible pressure on {currency}',
      sourcesEyebrow: 'GO TO THE SOURCE',
      sourcesTitle: 'Make the evidence part of the story.',
      sourcesSubtitle: 'Use research chat to search the web and read relevant sources. The local scenario previews remain hypothetical.',
      fedTitle: 'Federal Reserve',
      fedDesc: 'US policy announcements ↗',
      masTitle: 'Monetary Authority of Singapore',
      masDesc: 'Singapore monetary policy ↗',
      ecbTitle: 'European Central Bank',
      ecbDesc: 'Euro area news and policy ↗',
    },
    budget: {
      eyebrow: 'FROM EXCHANGE RATES TO REAL PLANS',
      title: 'Budget planner',
      subtitle: 'Understand what a currency move could mean for your next payment.',
      tag: 'Saved only in this browser',
      formTitle: 'Build your scenario',
      modeLabel: 'What are you planning?',
      modeSend: 'I have an amount to exchange',
      modeReceive: 'I need to receive a target amount',
      changePair: 'Change pair',
      amountSend: 'Amount to exchange ({currency})',
      amountReceive: 'Target amount to receive ({currency})',
      feePercent: 'Percentage fee (%)',
      feeFlatPrefix: 'Fixed fee (',
      feeFlatSuffix: ')',
      inputHelp: 'Fees are deducted in the source currency before conversion. Reference rates are not provider quotes.',
      nameLabel: 'Scenario name',
      defaultName: 'My next exchange',
      namePlaceholder: 'e.g. Semester tuition',
      saveBtn: 'Save scenario',
      outcomeTitle: 'Your planning range',
      horizonPill: '{horizon}-day outlook',
      resultSend: 'Estimated amount received after fees',
      resultReceive: 'Estimated source amount needed, including fees',
      vsCurrent: '{sign}{amount} versus the current reference-rate scenario',
      lowerAmount: 'Lower amount',
      higherAmount: 'Higher amount',
      atCurrentRate: 'At current reference rate',
      sourceFees: 'Source-currency fees',
      scenarioAdjustment: 'Scenario adjustment',
      infoNote: "The range inherits the forecast model's assumptions. Actual rates, fees, and outcomes may differ. Use this to explore a budget, not as a guaranteed quote.",
      savedTitle: 'Saved scenarios',
      savedSubtitle: 'Your planning notes stay on this device.',
      clearAll: 'Clear all',
      emptySaved: 'No saved scenarios yet. Build one above and keep it for later.',
      weekdaysCount: '{horizon} weekdays',
      loadBtn: 'Load',
      deleteBtn: 'Delete',
      deleteAria: 'Delete {name}',
      toastSaved: 'Scenario saved in this browser.',
      toastStorageUnavailable: 'Browser storage is unavailable; this scenario cannot be saved.',
      toastLoaded: 'Scenario loaded using the currently available reference data.',
      toastCleared: 'Saved budget data has been deleted from this browser.',
    },
    method: {
      eyebrow: 'TRANSPARENCY, BY DESIGN',
      title: 'Behind the forecast',
      subtitle: 'A useful demo should explain its assumptions as clearly as its outputs.',
      tag: 'Model card · v2.0',
      introPill: 'WHAT YOU ARE LOOKING AT',
      introTitle: 'Real reference data.<br>A deliberately transparent model.',
      introBody: 'FX Warriors is our AI6101 mini-project: a student team research demo exploring how conversational AI, web research and traditional FX forecasting can work together. The agent draws charts, compares models and cites sources. Traditional numerical outputs are supplied as prompt context and callable tools.',
      card1Title: '01 / Data',
      card1P1: 'Daily ECB reference rates are loaded from a bundled, dated snapshot. Refresh requests a newer series from the Frankfurter API; if that fails, the snapshot remains available and labelled.',
      card1P2: 'All supported currency pairs are calculated from the same daily EUR reference table. Weekends and days without published observations are omitted.',
      card1Link: 'ECB reference data ↗',
      card2Title: '02 / Projection',
      card2P1: 'The model uses log returns. Its daily drift is 25% of the mean of the latest 20 returns; volatility is the sample standard deviation of up to 60 returns.',
      card2P2: 'The central path compounds this reduced drift. The 80% interval uses a normal-return approximation and grows with the square root of the horizon. Its coverage is not guaranteed or calibrated.',
      card3Title: '03 / Conversation & research',
      card3P1: 'The agent chooses charts, model tools, keyword web search and page reading according to your question. Follow-ups carry the recent conversation and current currency pair.',
      card3P2: 'Source cards distinguish search excerpts, page excerpts and official RSS. Tool activity shows what was actually called. A limited, free search service is used for this demo; failures and limits are shown explicitly.',
      card3Link: 'Start a conversation ↗',
      card4Title: '04 / Privacy & control',
      card4P1: "Budget scenarios are stored in your browser's local storage only when you save them. You can delete them individually or clear them all.",
      card4P2: 'Your messages and recent conversation context are sent to the model. Search queries and selected source URLs are sent to the research provider. Saved budgets are not sent. Conversations live in this page’s memory; the server stores only usage counters.',
      privacyClearBtn: 'Delete saved browser data',
      raipEyebrow: 'AI6101 · RESPONSIBLE AI PRACTICES',
      raipTitle: 'Explainability, fairness and privacy by design',
      raipPill: '3 RAIP pillars',
      raip1Title: '01 · Explainability & interpretability',
      raip1Body: 'Closed-form drift and volatility formulas, rolling baseline comparison, inspectable tool calls, and inline source citations keep every output verifiable.',
      raip2Title: '02 · Fairness & equal access',
      raip2Body: 'All six currencies share one symmetric EUR table with explicit coverage-gap notices, two-sided pair search, and automatic English/Chinese browser parity.',
      raip3Title: '03 · Privacy preservation',
      raip3Body: 'Saved budget amounts remain strictly in browser storage and never leave your device; server rate limits hash identifiers daily with no conversation logs.',
      evalTitle: 'A baseline worth challenging',
      evalSubtitle: 'Rolling historical check on the selected pair · no news adjustment',
      evalCountLoading: '— forecasts',
      evalCount: '{count} historical forecasts',
      modelMae: 'Model mean absolute error',
      baselineMae: 'No-change baseline error',
      directionAcc: 'Direction accuracy',
      insufficientHistory: 'Insufficient history',
      backtestNote: 'Rolling {horizon}-observation-ahead forecasts, starting after 31 observations. Only earlier data are used; news scenarios are excluded. {coverage}This short, overlapping sample is descriptive and does not establish future performance.',
      backtestCoverage: 'Observed 80% interval coverage: {pct}%. ',
      roadmapEyebrow: 'FROM DEMO TO RESEARCH',
      roadmapTitle: 'The next questions to test.',
      roadmapBody: "Does timestamped news add value beyond prices? Can forecast intervals be calibrated out of sample? Do explanations improve users' understanding? A production study would need longer datasets, point-in-time economic releases, a trained model, and a separate holdout evaluation.",
    },
    footer: {
      brand: 'FX WARRIORS <b>·</b> AI6101 Mini-Project · Student research demo',
      methodLink: 'Data & methodology ↗',
    },
    chat: {
      sectionAria: 'FX research conversation',
      connecting: 'Connecting…',
      configuredStatus: 'Student research demo · Web search available',
      unconfiguredStatus: 'Model connection unavailable',
      connectionFailed: 'Connection unavailable · reload to retry',
      newChat: 'New chat',
      eyebrow: 'AI6101 MINI-PROJECT · STUDENT TEAM DEMO',
      welcomeH1: 'FX Warriors<br><em>AI for currency research.</em>',
      welcomeSub: 'An AI6101 student project combining conversational AI, live web research and traditional FX models.<br>Built by the FX Warriors team. Ask in English or 中文.',
      inputSrLabel: 'Your currency question',
      placeholder: 'What would you like to know about a currency?',
      webSearchLabel: 'Web search',
      webSearchAuto: 'Auto',
      keyHint: 'Enter to send',
      sendAria: 'Send message',
      stopAria: 'Stop response',
      privacy: 'Messages and relevant conversation context go to the model; research queries go to search providers. Saved budgets stay in your browser.',
      examples: [
        {
          title: 'See the bigger picture',
          subtitle: 'Chart USD/SGD over three months',
          prompt: 'Show me a USD/SGD chart over the last three months.',
          icon: 'chart',
        },
        {
          title: 'Find what is moving FX',
          subtitle: 'Search the news behind EUR/USD',
          prompt: 'Search the latest news and policy affecting EUR/USD. Show me your sources.',
          icon: 'globe',
        },
        {
          title: 'Question the forecast',
          subtitle: 'Compare a model with a baseline',
          prompt: 'Show a USD/JPY chart with a 10-day forecast and compare the traditional model with a no-change baseline.',
          icon: 'layers',
        },
      ],
      supportedNote: 'Reference data. Transparent assumptions.',
      toolLabels: {
        get_traditional_forecast: 'Read the traditional forecast',
        show_fx_chart: 'Draw an exchange-rate chart',
        compare_traditional_models: 'Compare forecasting models',
        search_web: 'Search the web',
        read_source: 'Read a source',
        get_official_policy_news: 'Check official policy feeds',
      },
      you: 'You',
      thinking: 'Thinking about your question…',
      researching: 'Researching…',
      activityTitle: 'Research activity',
      working: 'Working',
      toolsCount: '{count} tools',
      toolsAndModelCount: '{tools} tools · {models} model calls',
      sourcesHeading: 'SOURCES',
      scopePage: 'Page excerpt read',
      scopeSearch: 'Search excerpt',
      scopeCachedRss: 'Cached official feed',
      scopeRss: 'Official feed',
      pubDateUnavailable: 'Publication date unavailable',
      noticesSummary: 'Data & availability notes',
      modelContextStatus: '{pair} · {horizon}-weekday model context',
      stoppedStatus: 'Stopped',
      stoppedMessage: 'Response stopped. You can ask another question.',
      failedStatus: 'Could not complete',
      retryBtn: 'Try this question again',
      msgTooLong: 'Keep your message below 2,000 characters.',
      streamUnavailable: 'The response stream is unavailable.',
      streamEndedEarly: 'The connection ended before the response completed.',
      httpError: 'The chat service returned HTTP {status}.',
    },
    chart: {
      notEnoughHistory: 'There is not enough history to draw this chart.',
      eyebrowWithForecast: 'HISTORY + MODEL PROJECTION',
      eyebrowHistoryOnly: 'REFERENCE-RATE HISTORY',
      perBase: '{quote} per 1 {base}',
      changeOverShown: '{pct} over shown history',
      ariaRates: '{pair} historical rates',
      ariaWithForecast: ' and illustrative forecast',
      descForecast: 'The dashed line is a traditional-model projection with an uncalibrated 80 percent interval.',
      descHistory: 'Historical reference observations only.',
      descPrefix: 'Latest reference rate {spot} on {date}. ',
      legendHistory: 'Reference history',
      legendProjection: 'Model projection',
      legendInterval: '80% interval',
      asOf: 'As of {date}',
      noteForecast: ' · Illustrative forecast; interval is not calibrated.',
      noteHistory: ' · Daily reference rates, not transaction quotes.',
      tooltipProjection: ' · projection',
    },
  },
  zh: {
    htmlLang: 'zh-CN',
    metaDescription: 'AI6101 学生团队研究项目，结合对话式 AI、网页研究与传统外汇模型。',
    skipToContent: '跳到正文',
    brandHomeAria: 'FX Warriors 首页',
    brandSub: 'AI6101 学生研究项目',
    navLabel: '工作区',
    nav: {
      agent: '研究对话',
      desk: '预测台',
      signals: '信号实验室',
      budget: '预算规划',
      method: '模型原理',
    },
    sidebarNoteTitle: '清晰，即是优势。',
    sidebarNoteBody: '看清数据依据。<br>审视预测假设。<br>做出理性决策。',
    sidebarNoteLink: '了解研究方法',
    projectTagTitle: 'AI6101 课程项目',
    projectTagSub: '由 FX Warriors 团队开发',
    workspaceLabel: '工作区',
    langToggleLabel: 'EN',
    langToggleAria: '切换语言为英文（当前自动适配浏览器：中文）',
    langToggleTitle: '切换到 English（当前已自动跟随浏览器语言）',
    infoButtonAria: '关于此演示',
    teamAria: 'FX Warriors 团队',
    titles: {
      desk: '预测台',
      agent: '研究对话',
      signals: '信号实验室',
      budget: '预算规划',
      method: '模型原理',
    },
    titleSuffix: ' — FX Warriors · AI6101 课程项目',
    status: {
      loadingRef: '正在加载参考数据',
      refreshedRef: '已刷新参考数据',
      snapshotPrefix: 'ECB 快照 · {date}',
      refUnavailable: '参考数据不可用',
      loadingEllipsis: '加载中…',
      loadingForecast: '正在加载预测…',
      loadingDataProvenance: '正在加载数据来源信息…',
    },
    desk: {
      eyebrow: '更清晰地洞察汇率变动',
      title: '预测台',
      subtitle: '观察历史走势，理解多种可能性。',
      refresh: '刷新汇率',
      refreshAria: '刷新参考汇率',
      export: '导出预测',
      exportAria: '导出预测 CSV 文件',
      watchlistAria: '货币对观察列表',
      viewPairAria: '查看 {base} 兑 {quote}',
      sectionOutlook: '汇率展望',
      baseAria: '基础货币',
      swapAria: '互换基础货币与报价货币',
      quoteAria: '报价货币',
      rangeAria: '历史区间',
      range1M: '1月',
      range3M: '3月',
      rangeAll: '全部',
      chartAria: '历史汇率与演示级预测走势图',
      rateDescDefault: '每 1 单位基础货币兑报价货币',
      rateDesc: '1 {base} 兑 {quote} · 每日官方参考汇率',
      lastSession: '较上一交易日 {pct}',
      legendHistory: '参考历史走势',
      legendProjection: '模型预测路径',
      legendInterval: '80% 模型区间',
      asOf: '截至 {year}年{date}',
      chartTitle: '{base}/{quote} 历史汇率与未来 {horizon} 天演示预测',
      chartDesc: '最新汇率 {spot}，预测中心值 {center}，80% 模型区间 {lower} 至 {upper}。',
      tooltipProjection: '模型预测',
      tooltipReference: '参考汇率',
      forecastLens: '预测透视',
      illustrativeModel: '演示模型',
      horizonLabel: '预测周期',
      days5: '5 天',
      days10: '10 天',
      days20: '20 天',
      forecastDesc: '未来 {horizon} 个工作日预计变化 {pct}',
      intervalLabel: '80% 模型区间',
      intervalTooltip: '基于近期历史波动率计算的统计区间，并非经过样本外校准的概率保证。',
      recentTrend: '近期趋势',
      upwardDrift: '↗ 上行漂移',
      downwardDrift: '↘ 下行漂移',
      annualisedVol: '年化波动率',
      scenarioAdjustment: '情景调整',
      none: '无',
      footnoteDefault: '基于历史每日汇率构建的透明基线模型。',
      footnotePlain: '基于近期日度对数收益率构建，预测区间未经样本外校准。',
      footnoteScenario: '包含到期 {pct} 的假设冲击。此为情景假设，并非因果估计。',
      understandForecast: '了解此预测模型',
      scenarioTitle: '什么可能影响市场？',
      scenarioSubtitle: '一次一个假设，探索突发事件对汇率的影响。',
      openLab: '进入实验室',
      hypotheticalEvent: '假设事件',
      exploreScenario: '探索情景',
      quickTitle: '结合实际金额换算',
      quickSubtitle: '输入兑换金额，让预测更贴近实际用途。',
      youExchange: '计划兑换 ',
      atRefRate: '按当前参考汇率',
      atProjRate: '按模型预测中心汇率',
      enterValidAmount: '请输入有效金额',
      planExchange: '规划您的换汇方案',
      teaserQuestion: '对这组货币对有疑问？',
      teaserAction: '打开研究对话',
      footerSourceDefault: '每日参考汇率 · 演示级预测 · 不构成投资建议',
      footerSourceData: '数据截至 {date} · 演示级预测 · 不构成投资建议',
      toastExported: '已导出包含日期与模型假设的预测 CSV。',
      toastRefreshed: '已刷新参考汇率数据至 {date}。',
      toastRefreshFallback: '实时汇率服务暂不可用，继续使用已验证的 ECB 快照（截至 {date}）。',
      toastSnapshotError: '无法加载参考汇率数据，请刷新页面重试。',
      reloadPrompt: '请刷新页面重试。',
      dataDetail: '共 {count} 条观测 · {start} 至 {end} · {source}',
      sourceFrankfurter: '实时获取自 Frankfurter',
      sourceSnapshot: '内置 ECB 参考快照',
    },
    signals: {
      eyebrow: '新闻 → 假设 → 情景',
      title: '信号实验室',
      subtitle: '看看一条新闻或政策标题如何改变汇率前景。',
      tag: '假设情景工作区',
      bringTitle: '输入新闻标题',
      bringSubtitle: '粘贴新闻或选择下方示例，本地关键词分类器将提出一个情景供您审视和微调。',
      headlineLabel: '新闻标题或政策简讯',
      headlinePlaceholder: '例如：美联储暗示维持高利率更长时间，通胀高于预期。',
      currencyLabel: '受影响货币',
      analyseBtn: '关键词预分析',
      researchHeadlineBtn: '用 AI 检索核实此标题',
      researchPromptPrefix: '请检索核实这条未经证实的新闻标题，并给出支持或相矛盾的权威来源：',
      samplesLabel: '试一试假设事件',
      infoNote: '本功能仅使用轻量级关键词分类器，而非训练好的大语言模型；不会核实新闻真伪或推断因果效应，请自行审视并调整假设。',
      resultTitle: '情景解读',
      awaitingInput: '等待输入',
      keywordStatus: '关键词解读',
      manualStatus: '手动设定假设',
      defaultLabel: '新闻标题只是一个起点。',
      defaultExplanation: '添加一条事件，探索对当前所选货币对的示意性影响。',
      manualLabel: '自定义假设情景。',
      manualExplanation: '此影响幅度由您手动设定，不代表对市场真实反应的预测。',
      impactLabelPrefix: '假设到期对 ',
      impactLabelSuffix: ' 的影响幅度',
      bpsUnit: '基点 (bps)',
      sliderMin: '−1.00%',
      sliderZero: '无变化',
      sliderMax: '+1.00%',
      applyBtn: '应用到预测',
      clearBtn: '重置情景',
      toastNeedHeadline: '请先输入新闻标题或选择一个示例。',
      toastApplied: '已应用情景：到期影响 {bps} 基点。',
      toastCleared: '已重置情景，预测仅基于历史汇率数据。',
      explainOutside: '所选货币不在当前货币对 {base}/{quote} 中，请选择该货币对内的币种或手动拖动滑块设定情景。',
      explainNegated: '文本包含否定或不确定表述，系统暂将影响保持为 0，请结合上下文再决定是否设定假设。',
      explainClassified: '匹配到的关键词显示对 {currency} 可能存在{dir}倾向。初始 ±35 bps 仅为演示预设，而非模型学习结果。',
      explainSupportive: '偏多支撑',
      explainNegative: '偏空承压',
      explainNone: '未能识别出明确的方向性关键词，您仍可使用下方滑块手动设置假设幅度。',
      labelOutside: '所选货币不在当前货币对内',
      labelNeedsReview: '语境包含否定/不确定性，需人工复核',
      labelNoSignal: '未检测到明确关键词信号',
      labelMixed: '多空信号混合',
      labelSupport: '可能对 {currency} 形成支撑',
      labelPressure: '可能对 {currency} 构成压力',
      sourcesEyebrow: '溯源核查',
      sourcesTitle: '让一手官方证据成为判断依据。',
      sourcesSubtitle: '使用“研究对话”在线搜索并阅读权威来源；本地情景预览仍属于假设推演。',
      fedTitle: '美联储 (Federal Reserve)',
      fedDesc: '美国货币政策公告 ↗',
      masTitle: '新加坡金管局 (MAS)',
      masDesc: '新加坡货币政策声明 ↗',
      ecbTitle: '欧洲央行 (ECB)',
      ecbDesc: '欧元区新闻与政策公告 ↗',
    },
    budget: {
      eyebrow: '从汇率预测到实际预算',
      title: '预算规划',
      subtitle: '估算汇率波动对您下一笔实际换汇或付款的影响。',
      tag: '仅保存在当前浏览器',
      formTitle: '构建换汇方案',
      modeLabel: '您的兑换计划类型',
      modeSend: '我有固定金额需要换出',
      modeReceive: '我需要实收固定目标金额',
      changePair: '切换货币对',
      amountSend: '计划换出金额 ({currency})',
      amountReceive: '目标实收金额 ({currency})',
      feePercent: '比例手续费 (%)',
      feeFlatPrefix: '固定手续费 (',
      feeFlatSuffix: ')',
      inputHelp: '手续费在兑换前从原币中扣除。官方参考汇率不等同于银行或机构实际交易报价。',
      nameLabel: '方案名称',
      defaultName: '我的下一笔换汇',
      namePlaceholder: '例如：下学期学费',
      saveBtn: '保存方案',
      outcomeTitle: '预算估算区间',
      horizonPill: '{horizon} 天展望',
      resultSend: '扣除手续费后预计实收金额',
      resultReceive: '含手续费预计所需原币金额',
      vsCurrent: '较当前参考汇率方案 {sign}{amount}',
      lowerAmount: '区间下限',
      higherAmount: '区间上限',
      atCurrentRate: '按当前参考汇率',
      sourceFees: '原币手续费合计',
      scenarioAdjustment: '情景调整',
      infoNote: '预算区间直接继承预测模型的假设。实际汇率、手续费与成交结果可能存在差异，请仅作预算参考，不作为报价保证。',
      savedTitle: '已保存方案',
      savedSubtitle: '您的规划记录仅保留在本地设备浏览器中。',
      clearAll: '全部清空',
      emptySaved: '暂无已保存方案，可在上方创建一个方案以便随时加载对比。',
      weekdaysCount: '{horizon} 个工作日',
      loadBtn: '加载',
      deleteBtn: '删除',
      deleteAria: '删除 {name}',
      toastSaved: '方案已保存至当前浏览器。',
      toastStorageUnavailable: '浏览器本地存储不可用，无法保存该方案。',
      toastLoaded: '已使用当前最新参考汇率重新加载该方案。',
      toastCleared: '已从当前浏览器删除所有已保存的预算方案。',
    },
    method: {
      eyebrow: '透明化设计',
      title: '模型原理',
      subtitle: '有价值的演示系统不仅给出结果，更应清晰交代所有假设。',
      tag: '模型说明卡 · v2.0',
      introPill: '系统说明',
      introTitle: '真实官方参考数据。<br>清晰透明的量化基线。',
      introBody: 'FX Warriors 是我们的 AI6101 课程研究项目，探索对话式 AI、实时网页检索与传统外汇预测模型如何协同工作。智能体可按需绘图、对比模型并引用来源；传统量化模型数值均作为服务端上下文与可调用工具提供。',
      card1Title: '01 / 数据来源',
      card1P1: '系统内置了欧洲央行（ECB）带日期标记的每日参考汇率快照；点击刷新会向 Frankfurter API 请求最新序列，若网络受限则保留快照并清晰标注。',
      card1P2: '所有支持的货币对均由同一张每日欧元交叉汇率表计算得出，自动跳过周末及无公布报价的日期。',
      card1Link: 'ECB 参考汇率说明 ↗',
      card2Title: '02 / 趋势外推模型',
      card2P1: '模型基于对数收益率计算：日度漂移项取最近 20 个交易日平均收益率的 25%；波动率取最多最近 60 个交易日收益率的样本标准差。',
      card2P2: '中心路径按收缩后的漂移率复利外推，80% 区间基于正态假设并随预测天数平方根扩张，未经过历史覆盖率校准。',
      card3Title: '03 / 智能对话与网页研究',
      card3P1: '智能体会根据您的问题自主调用绘图、模型对比、关键词网页搜索与正文精读工具，多轮追问会携带近期上下文与当前货币对。',
      card3P2: '来源卡片严格区分搜索摘要、正文精读片段与央行 RSS 订阅；展开“研究工具调用详情”可查看真实参数与返回。演示使用免费限额搜索，失败或超限均如实提示。',
      card3Link: '开始对话研究 ↗',
      card4Title: '04 / 隐私与本地控制',
      card4P1: '预算方案仅在您主动保存时写入浏览器 localStorage，可随时单项删除或一键清空。',
      card4P2: '您的对话内容与近期上下文会发送给配置的模型服务；搜索关键词与选定来源 URL 会发送给检索服务。本地保存的预算金额不会发送至服务器，对话记录仅存于当前页面内存中。',
      privacyClearBtn: '清除浏览器本地保存数据',
      raipEyebrow: 'AI6101 · 负责任 AI 实践 (RAIP)',
      raipTitle: '原生嵌入可解释性、公平性与隐私保护',
      raipPill: '三大 RAIP 维度',
      raip1Title: '01 · 可解释性与透明性',
      raip1Body: '公开漂移与波动率数学公式、滚动基线误差对比、可展开的工具调用追踪以及行内来源引用，让每项输出均可核查。',
      raip2Title: '02 · 公平性与无障碍访问',
      raip2Body: '六种货币共用对称的欧元交叉汇率表并明确披露央行订阅覆盖缺口，检索同时关注货币对双边，并提供浏览器自适应中英双语界面。',
      raip3Title: '03 · 隐私保护',
      raip3Body: '保存的预算金额仅保留在浏览器本地存储，永不上传至模型或搜索引擎；服务端限流采用按日加盐哈希，不留存对话日志。',
      evalTitle: '值得检验的基线表现',
      evalSubtitle: '当前货币对的历史滚动回测 · 不含新闻情景调整',
      evalCountLoading: '— 次历史预测',
      evalCount: '{count} 次历史滚动预测',
      modelMae: '模型平均绝对误差 (MAE)',
      baselineMae: '无变化基线误差',
      directionAcc: '方向准确率',
      insufficientHistory: '历史样本不足',
      backtestNote: '从第 31 个观测起滚动向前预测 {horizon} 个观测期，仅使用历史更早数据且不含新闻情景。{coverage}该短样本重叠回测仅用于描述模型特性，不能证明未来预测能力。',
      backtestCoverage: '样本内 80% 区间实际命中率：{pct}%。',
      roadmapEyebrow: '从演示走向深入研究',
      roadmapTitle: '下一步值得验证的研究问题。',
      roadmapBody: '带精确时间戳的新闻文本是否能在价格之外带来增量信息？预测区间能否通过样本外滚动校准？可解释性界面能否提升用户决策理解？正式实证研究仍需更长跨度的数据、时点一致的宏观发布记录、专门训练的模型及严格样本外验证。',
    },
    footer: {
      brand: 'FX WARRIORS <b>·</b> AI6101 课程项目 · 学生团队研究演示',
      methodLink: '数据与方法说明 ↗',
    },
    chat: {
      sectionAria: 'FX 外汇研究对话',
      connecting: '正在连接服务…',
      configuredStatus: '学生研究演示 · 实时网页搜索可用',
      unconfiguredStatus: '模型服务暂未配置',
      connectionFailed: '连接不可用 · 请刷新页面重试',
      newChat: '新对话',
      eyebrow: 'AI6101 课程项目 · 学生团队研究演示',
      welcomeH1: 'FX Warriors<br><em>外汇研究智能助手。</em>',
      welcomeSub: '结合对话式 AI、实时网页检索与传统外汇模型的 AI6101 学生项目。<br>由 FX Warriors 团队打造，支持中文与英文自然提问。',
      inputSrLabel: '输入您的外汇研究问题',
      placeholder: '想了解哪组货币走势、模型对比或最新央行政策？',
      webSearchLabel: '网页搜索',
      webSearchAuto: '自动',
      keyHint: '按 Enter 发送',
      sendAria: '发送消息',
      stopAria: '停止生成',
      privacy: '您的问题与近期上下文会发送至模型，检索关键词会发送至搜索服务；浏览器中保存的预算数据不会上传。',
      examples: [
        {
          title: '把握整体走势',
          subtitle: '查看 USD/SGD 近三个月走势图',
          prompt: '画一下美元兑新元（USD/SGD）最近三个月的汇率走势图。',
          icon: 'chart',
        },
        {
          title: '追踪市场驱动因素',
          subtitle: '搜索影响 EUR/USD 的最新政策新闻',
          prompt: '搜索影响欧元兑美元（EUR/USD）的最新新闻与货币政策，并给出信息来源。',
          icon: 'globe',
        },
        {
          title: '审视对比预测模型',
          subtitle: '对比传统模型与无变化基线',
          prompt: '画一下美元兑日元（USD/JPY）未来10天预测图，并对比传统模型与无变化基线。',
          icon: 'layers',
        },
      ],
      supportedNote: '官方参考数据 · 假设公开透明',
      toolLabels: {
        get_traditional_forecast: '读取传统模型数值预测',
        show_fx_chart: '绘制汇率走势图表',
        compare_traditional_models: '对比多种传统预测模型',
        search_web: '检索实时网页新闻',
        read_source: '精读来源网页正文',
        get_official_policy_news: '查看央行官方政策订阅',
      },
      you: '你',
      thinking: '正在分析您的问题…',
      researching: '正在检索研究…',
      activityTitle: '研究工具调用详情',
      working: '处理中',
      toolsCount: '{count} 次工具调用',
      toolsAndModelCount: '{tools} 次工具调用 · {models} 轮模型推理',
      sourcesHeading: '参考来源',
      scopePage: '已读取网页正文摘录',
      scopeSearch: '搜索结果摘要',
      scopeCachedRss: '缓存的官方政策订阅',
      scopeRss: '央行官方政策订阅',
      pubDateUnavailable: '暂无发布日期',
      noticesSummary: '数据与可用性说明',
      modelContextStatus: '{pair} · 未来 {horizon} 个工作日模型上下文',
      stoppedStatus: '已停止',
      stoppedMessage: '已停止回答。您可以继续提出新的问题。',
      failedStatus: '未能完成',
      retryBtn: '重试此问题',
      msgTooLong: '消息长度请控制在 2,000 字以内。',
      streamUnavailable: '流式响应通道不可用。',
      streamEndedEarly: '连接在回答完成前提前中断。',
      httpError: '对话服务返回 HTTP {status}。',
    },
    chart: {
      notEnoughHistory: '历史观测数据不足，无法绘制该图表。',
      eyebrowWithForecast: '历史走势 + 模型外推预测',
      eyebrowHistoryOnly: '官方参考汇率历史走势',
      perBase: '1 {base} 兑 {quote}',
      changeOverShown: '所选区间变动 {pct}',
      ariaRates: '{pair} 历史汇率',
      ariaWithForecast: '与演示预测走势',
      descForecast: '虚线为传统模型外推预测路径及未经校准的 80% 波动区间。',
      descHistory: '仅展示历史官方参考汇率观测值。',
      descPrefix: '截至 {date} 最新参考汇率 {spot}。',
      legendHistory: '参考历史',
      legendProjection: '模型预测',
      legendInterval: '80% 区间',
      asOf: '截至 {date}',
      noteForecast: ' · 演示预测路径，波动区间未经校准。',
      noteHistory: ' · 每日官方参考汇率，非实际交易报价。',
      tooltipProjection: ' · 预测',
    },
  },
};

export const SCENARIOS_BY_LANG = {
  en: [
    {
      title: 'US inflation surprises to the upside',
      short: 'Higher US inflation',
      currency: 'USD',
      text: 'US inflation rises above expectations as markets anticipate higher interest rates.',
      type: 'Economic data',
      icon: 'chart',
    },
    {
      title: 'The Fed signals an interest-rate cut',
      short: 'A more dovish Fed',
      currency: 'USD',
      text: 'The Federal Reserve signals an interest rate cut and a more dovish policy stance.',
      type: 'Central bank policy',
      icon: 'bank',
    },
    {
      title: 'Singapore growth beats expectations',
      short: 'Stronger Singapore growth',
      currency: 'SGD',
      text: 'Singapore reports stronger growth and an economic expansion above expectations.',
      type: 'Growth outlook',
      icon: 'globe',
    },
  ],
  zh: [
    {
      title: '美国通胀超预期上行',
      short: '美国通胀高于预期',
      currency: 'USD',
      text: '美国通胀超预期上升，市场预期美联储将维持高利率或采取更鹰派立场。',
      type: '宏观数据',
      icon: 'chart',
    },
    {
      title: '美联储释放降息信号',
      short: '美联储立场转鸽',
      currency: 'USD',
      text: '美联储释放降息信号并转向更偏鸽派的货币政策立场。',
      type: '央行政策',
      icon: 'bank',
    },
    {
      title: '新加坡经济增长超预期',
      short: '新加坡增长强劲',
      currency: 'SGD',
      text: '新加坡公布经济扩张数据好于预期，增长表现强劲。',
      type: '增长前景',
      icon: 'globe',
    },
  ],
};

export function getScenarios(lang = currentLang) {
  return SCENARIOS_BY_LANG[lang === 'zh' ? 'zh' : 'en'];
}

export function t(path, vars = null, lang = currentLang) {
  const dict = STRINGS[lang === 'zh' ? 'zh' : 'en'];
  let val = dict;
  for (const part of path.split('.')) {
    if (val == null) break;
    val = val[part];
  }
  if (typeof val !== 'string') return path;
  if (!vars) return val;
  return val.replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? String(vars[key]) : '{' + key + '}'));
}

export function formatDateShort(isoDate, lang = currentLang) {
  const d = new Date(isoDate + 'T12:00:00Z');
  if (Number.isNaN(d.valueOf())) return isoDate;
  return d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-GB', { day: 'numeric', month: 'short' });
}

export function formatDateLong(value, lang = currentLang) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.valueOf())) return null;
  return d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function localizeStatus(message, lang = currentLang) {
  if (lang !== 'zh') return message;
  const map = {
    'Thinking about your question…': '正在分析您的问题…',
    'Connecting the evidence…': '正在整合研究证据…',
  };
  return map[message] || message;
}

export function localizeNotice(message, lang = currentLang) {
  if (lang !== 'zh' || typeof message !== 'string') return message;
  if (message === 'The two-search limit for this message has been reached.') return '本条消息已达到最多 2 次网页搜索上限。';
  if (message === 'The two-page reading limit for this message has been reached.') return '本条消息已达到最多 2 次网页正文精读上限。';
  if (message === 'Web search is temporarily rate limited. Please try again later.') return '网页搜索服务暂时触发限流，请稍后再试。';
  if (message === 'No usable web results were returned for this query.') return '当前检索关键词未返回可用网页结果。';
  if (message === 'This page could not be read. Its search excerpt remains available.') return '无法读取该网页正文，仍可参考搜索摘要。';
  const gapMatch = /^No dedicated ([A-Z]{3}) central-bank feed is connected in this version\.$/.exec(message);
  if (gapMatch) return '当前版本暂未接入 ' + gapMatch[1] + ' 的专属央行 RSS 订阅源。';
  const cacheMatch = /^(Federal Reserve|European Central Bank): Live official feed unavailable\. Using official RSS cached on (\d{4}-\d{2}-\d{2}); newer publications may be missing\.$/.exec(message);
  if (cacheMatch) {
    const bank = cacheMatch[1] === 'Federal Reserve' ? '美联储' : '欧洲央行';
    return bank + '：实时官方订阅暂不可用，已回退至 ' + cacheMatch[2] + ' 缓存的官方 RSS，可能缺少最新公告。';
  }
  return message;
}

export function localizeBudgetError(message, lang = currentLang) {
  if (lang !== 'zh' || typeof message !== 'string') return message;
  if (message.includes('Enter a positive amount')) return '请输入大于 0 且不超过 10 亿的有效金额，以及 0–20% 范围内的手续费。';
  if (message.includes('fees exceed')) return '手续费已超过您的换汇总金额。';
  return message;
}

export function localizeSourceMode(mode, lang = currentLang) {
  if (lang !== 'zh') return mode?.replaceAll('_', ' ') || 'reference data';
  const map = {
    freshly_fetched_reference_data: '实时获取的欧洲央行参考数据',
    bundled_reference_snapshot: '内置欧洲央行参考快照',
    test_reference_snapshot: '测试参考数据快照',
  };
  return map[mode] || '官方参考数据';
}

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function setAttr(selector, attr, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

function setFirstTextNode(selector, value) {
  const el = document.querySelector(selector);
  if (!el) return;
  for (const node of el.childNodes) {
    if (node.nodeType === 3) {
      node.nodeValue = value;
      return;
    }
  }
  el.prepend(document.createTextNode(value));
}

export function applyStaticI18n(lang = currentLang) {
  document.documentElement.lang = t('htmlLang', null, lang);
  setAttr('meta[name="description"]', 'content', t('metaDescription', null, lang));

  setText('.skip-link', t('skipToContent', null, lang));
  setAttr('.brand', 'aria-label', t('brandHomeAria', null, lang));
  setText('.brand small', t('brandSub', null, lang));
  setText('.nav-label', t('navLabel', null, lang));

  for (const viewKey of ['desk', 'signals', 'budget', 'method']) {
    const navLink = document.querySelector(`.nav-link[data-view="${viewKey}"]`);
    if (navLink) {
      navLink.setAttribute('aria-label', t(`nav.${viewKey}`, null, lang));
      const labelSpan = navLink.querySelector('span:not(.nav-dot)');
      if (labelSpan) labelSpan.textContent = t(`nav.${viewKey}`, null, lang);
    }
  }

  setText('.sidebar-note h3', t('sidebarNoteTitle', null, lang));
  const noteP = document.querySelector('.sidebar-note p');
  if (noteP) noteP.innerHTML = t('sidebarNoteBody', null, lang);
  setFirstTextNode('.sidebar-note a', t('sidebarNoteLink', null, lang) + ' ');

  const projectSpan = document.querySelector('.project-tag > span:last-child');
  if (projectSpan) {
    setFirstTextNode('.project-tag > span:last-child', t('projectTagTitle', null, lang));
    setText('.project-tag small', t('projectTagSub', null, lang));
  }

  setFirstTextNode('.topbar .breadcrumb', t('workspaceLabel', null, lang) + ' ');
  const langToggle = document.querySelector('#lang-toggle');
  if (langToggle) {
    langToggle.textContent = t('langToggleLabel', null, lang);
    langToggle.setAttribute('aria-label', t('langToggleAria', null, lang));
    langToggle.setAttribute('title', t('langToggleTitle', null, lang));
  }
  setAttr('#info-button', 'aria-label', t('infoButtonAria', null, lang));
  setAttr('.top-actions .avatar', 'aria-label', t('teamAria', null, lang));

  // Desk view
  setText('#view-desk .eyebrow', t('desk.eyebrow', null, lang));
  setFirstTextNode('#desk-title', t('desk.title', null, lang));
  setText('#view-desk .page-heading p', t('desk.subtitle', null, lang));
  setAttr('#refresh', 'aria-label', t('desk.refreshAria', null, lang));
  setText('#refresh span', t('desk.refresh', null, lang));
  setAttr('#export', 'aria-label', t('desk.exportAria', null, lang));
  setText('#export span', t('desk.export', null, lang));
  setAttr('#watchlist', 'aria-label', t('desk.watchlistAria', null, lang));
  setText('#view-desk .chart-card .section-label', t('desk.sectionOutlook', null, lang));
  setAttr('#base-currency', 'aria-label', t('desk.baseAria', null, lang));
  setAttr('#swap', 'aria-label', t('desk.swapAria', null, lang));
  setAttr('#quote-currency', 'aria-label', t('desk.quoteAria', null, lang));
  setAttr('#chart-range', 'aria-label', t('desk.rangeAria', null, lang));
  setText('#chart-range [data-range="21"]', t('desk.range1M', null, lang));
  setText('#chart-range [data-range="60"]', t('desk.range3M', null, lang));
  setText('#chart-range [data-range="all"]', t('desk.rangeAll', null, lang));
  setAttr('#rate-chart', 'aria-label', t('desk.chartAria', null, lang));

  const legendSpans = document.querySelectorAll('.chart-legend > span');
  if (legendSpans.length >= 3) {
    legendSpans[0].innerHTML = '<b class="line-key"></b>' + t('desk.legendHistory', null, lang);
    legendSpans[1].innerHTML = '<b class="line-key dashed"></b>' + t('desk.legendProjection', null, lang);
    legendSpans[2].innerHTML = '<b class="band-key"></b>' + t('desk.legendInterval', null, lang);
  }

  setText('.forecast-card h2', t('desk.forecastLens', null, lang));
  setText('.forecast-card .model-pill', t('desk.illustrativeModel', null, lang));
  setText('.forecast-card .field-label', t('desk.horizonLabel', null, lang));
  setText('#horizon-buttons [data-days="5"]', t('desk.days5', null, lang));
  setText('#horizon-buttons [data-days="10"]', t('desk.days10', null, lang));
  setText('#horizon-buttons [data-days="20"]', t('desk.days20', null, lang));
  setText('.range-label span', t('desk.intervalLabel', null, lang));
  setAttr('.range-label i', 'title', t('desk.intervalTooltip', null, lang));
  const factorLabels = document.querySelectorAll('.factor-list > div > span');
  if (factorLabels.length >= 3) {
    factorLabels[0].textContent = t('desk.recentTrend', null, lang);
    factorLabels[1].textContent = t('desk.annualisedVol', null, lang);
    factorLabels[2].textContent = t('desk.scenarioAdjustment', null, lang);
  }
  setFirstTextNode('.forecast-card > .text-link', t('desk.understandForecast', null, lang) + ' ');

  setText('.scenario-card h2', t('desk.scenarioTitle', null, lang));
  setText('.scenario-card .muted', t('desk.scenarioSubtitle', null, lang));
  setFirstTextNode('.scenario-card .text-link', t('desk.openLab', null, lang) + ' ');

  setText('.quick-budget h2', t('desk.quickTitle', null, lang));
  setText('.quick-budget .muted', t('desk.quickSubtitle', null, lang));
  setFirstTextNode('.quick-input-label', t('desk.youExchange', null, lang));
  const quickResultLabels = document.querySelectorAll('.quick-result > span');
  if (quickResultLabels.length >= 2) {
    quickResultLabels[0].textContent = t('desk.atRefRate', null, lang);
    quickResultLabels[1].textContent = t('desk.atProjRate', null, lang);
  }
  setFirstTextNode('.budget-link', t('desk.planExchange', null, lang) + ' ');

  // Signals view
  setText('#view-signals .eyebrow', t('signals.eyebrow', null, lang));
  setFirstTextNode('#signals-title', t('signals.title', null, lang));
  setText('#view-signals .page-heading p', t('signals.subtitle', null, lang));
  setText('#view-signals .outline-tag', t('signals.tag', null, lang));
  setText('.lab-input h2', t('signals.bringTitle', null, lang));
  setText('.lab-input .muted', t('signals.bringSubtitle', null, lang));
  setText('label[for="headline"]', t('signals.headlineLabel', null, lang));
  setAttr('#headline', 'placeholder', t('signals.headlinePlaceholder', null, lang));
  setFirstTextNode('label[for="signal-currency"]', t('signals.currencyLabel', null, lang));
  setText('.samples-label', t('signals.samplesLabel', null, lang));
  setText('.lab-input .information-note p', t('signals.infoNote', null, lang));

  setText('.lab-result h2', t('signals.resultTitle', null, lang));
  const impactLabel = document.querySelector('label[for="impact-slider"]');
  if (impactLabel) {
    const nodes = [...impactLabel.childNodes].filter((n) => n.nodeType === 3);
    if (nodes[0]) nodes[0].nodeValue = t('signals.impactLabelPrefix', null, lang);
    if (nodes[1]) nodes[1].nodeValue = t('signals.impactLabelSuffix', null, lang);
  }
  setText('.impact-number span', t('signals.bpsUnit', null, lang));
  const sliderLabels = document.querySelectorAll('.slider-labels span');
  if (sliderLabels.length >= 3) {
    sliderLabels[0].textContent = t('signals.sliderMin', null, lang);
    sliderLabels[1].textContent = t('signals.sliderZero', null, lang);
    sliderLabels[2].textContent = t('signals.sliderMax', null, lang);
  }
  setFirstTextNode('#apply-signal', t('signals.applyBtn', null, lang) + ' ');
  setText('#clear-signal', t('signals.clearBtn', null, lang));

  setText('.sources-card .section-label', t('signals.sourcesEyebrow', null, lang));
  setText('.sources-card h2', t('signals.sourcesTitle', null, lang));
  const sourceLinks = document.querySelectorAll('.source-links a');
  if (sourceLinks.length >= 3) {
    sourceLinks[0].innerHTML = t('signals.fedTitle', null, lang) + ' <span>' + t('signals.fedDesc', null, lang) + '</span>';
    sourceLinks[1].innerHTML = t('signals.masTitle', null, lang) + ' <span>' + t('signals.masDesc', null, lang) + '</span>';
    sourceLinks[2].innerHTML = t('signals.ecbTitle', null, lang) + ' <span>' + t('signals.ecbDesc', null, lang) + '</span>';
  }

  // Budget view
  setText('#view-budget .eyebrow', t('budget.eyebrow', null, lang));
  setFirstTextNode('#budget-title', t('budget.title', null, lang));
  setText('#view-budget .page-heading p', t('budget.subtitle', null, lang));
  const budgetTag = document.querySelector('#view-budget .outline-tag');
  if (budgetTag) {
    const textNode = [...budgetTag.childNodes].find((n) => n.nodeType === 3);
    if (textNode) textNode.nodeValue = t('budget.tag', null, lang);
    else budgetTag.append(document.createTextNode(t('budget.tag', null, lang)));
  }
  setText('.budget-form h2', t('budget.formTitle', null, lang));
  setFirstTextNode('label[for="budget-mode"]', t('budget.modeLabel', null, lang));
  setText('#budget-mode option[value="send"]', t('budget.modeSend', null, lang));
  setText('#budget-mode option[value="receive"]', t('budget.modeReceive', null, lang));
  setText('.currency-summary a', t('budget.changePair', null, lang));
  setFirstTextNode('label[for="fee-percent"]', t('budget.feePercent', null, lang));
  const feeFlatLabel = document.querySelector('label[for="fee-flat"]');
  if (feeFlatLabel) {
    const nodes = [...feeFlatLabel.childNodes].filter((n) => n.nodeType === 3);
    if (nodes[0]) nodes[0].nodeValue = t('budget.feeFlatPrefix', null, lang);
    if (nodes[1]) nodes[1].nodeValue = t('budget.feeFlatSuffix', null, lang);
  }
  setText('.budget-form .input-help', t('budget.inputHelp', null, lang));
  setFirstTextNode('label[for="budget-name"]', t('budget.nameLabel', null, lang));
  setAttr('#budget-name', 'placeholder', t('budget.namePlaceholder', null, lang));
  const nameInput = document.querySelector('#budget-name');
  if (nameInput && (nameInput.value === STRINGS.en.budget.defaultName || nameInput.value === STRINGS.zh.budget.defaultName)) {
    nameInput.value = t('budget.defaultName', null, lang);
  }
  const saveBudgetBtn = document.querySelector('#save-budget');
  if (saveBudgetBtn) {
    const textNode = [...saveBudgetBtn.childNodes].find((n) => n.nodeType === 3);
    if (textNode) textNode.nodeValue = t('budget.saveBtn', null, lang);
    else saveBudgetBtn.append(document.createTextNode(t('budget.saveBtn', null, lang)));
  }

  setText('.budget-outcome h2', t('budget.outcomeTitle', null, lang));
  const rangeCardLabels = document.querySelectorAll('.budget-range-cards span');
  if (rangeCardLabels.length >= 2) {
    rangeCardLabels[0].textContent = t('budget.lowerAmount', null, lang);
    rangeCardLabels[1].textContent = t('budget.higherAmount', null, lang);
  }
  const compLabels = document.querySelectorAll('.budget-comparison span');
  if (compLabels.length >= 3) {
    compLabels[0].textContent = t('budget.atCurrentRate', null, lang);
    compLabels[1].textContent = t('budget.sourceFees', null, lang);
    compLabels[2].textContent = t('budget.scenarioAdjustment', null, lang);
  }
  setText('.budget-outcome .information-note p', t('budget.infoNote', null, lang));

  setText('.saved-card h2', t('budget.savedTitle', null, lang));
  setText('.saved-card .muted', t('budget.savedSubtitle', null, lang));
  setText('#clear-budgets', t('budget.clearAll', null, lang));

  // Method view
  setText('#view-method .eyebrow', t('method.eyebrow', null, lang));
  setFirstTextNode('#method-title', t('method.title', null, lang));
  setText('#view-method .page-heading p', t('method.subtitle', null, lang));
  setText('#view-method .outline-tag', t('method.tag', null, lang));
  setText('.method-intro .model-pill', t('method.introPill', null, lang));
  const introH2 = document.querySelector('.method-intro h2');
  if (introH2) introH2.innerHTML = t('method.introTitle', null, lang);

  const methodCards = document.querySelectorAll('.method-grid article');
  if (methodCards.length >= 4) {
    methodCards[0].querySelector('h2').textContent = t('method.card1Title', null, lang);
    const c1p = methodCards[0].querySelectorAll('p');
    if (c1p[0]) c1p[0].textContent = t('method.card1P1', null, lang);
    if (c1p[1]) c1p[1].textContent = t('method.card1P2', null, lang);
    const c1a = methodCards[0].querySelector('a');
    if (c1a) c1a.textContent = t('method.card1Link', null, lang);

    methodCards[1].querySelector('h2').textContent = t('method.card2Title', null, lang);
    const c2p = methodCards[1].querySelectorAll('p');
    if (c2p[0]) c2p[0].textContent = t('method.card2P1', null, lang);
    if (c2p[1]) c2p[1].textContent = t('method.card2P2', null, lang);

    methodCards[3].querySelector('h2').textContent = t('method.card4Title', null, lang);
    const c4p = methodCards[3].querySelectorAll('p');
    if (c4p[0]) c4p[0].textContent = t('method.card4P1', null, lang);
    setText('#privacy-clear', t('method.privacyClearBtn', null, lang));
  }

  setText('.raip-card .section-label', t('method.raipEyebrow', null, lang));
  setText('.raip-card h2', t('method.raipTitle', null, lang));
  setText('.raip-card .small-pill', t('method.raipPill', null, lang));
  const raipCols = document.querySelectorAll('.raip-grid > div');
  if (raipCols.length >= 3) {
    raipCols[0].querySelector('h3').textContent = t('method.raip1Title', null, lang);
    raipCols[0].querySelector('p').textContent = t('method.raip1Body', null, lang);
    raipCols[1].querySelector('h3').textContent = t('method.raip2Title', null, lang);
    raipCols[1].querySelector('p').textContent = t('method.raip2Body', null, lang);
    raipCols[2].querySelector('h3').textContent = t('method.raip3Title', null, lang);
    raipCols[2].querySelector('p').textContent = t('method.raip3Body', null, lang);
  }

  setText('.evaluation-card h2', t('method.evalTitle', null, lang));
  setText('.evaluation-card .muted', t('method.evalSubtitle', null, lang));
  const evalLabels = document.querySelectorAll('.evaluation-values span');
  if (evalLabels.length >= 3) {
    evalLabels[0].textContent = t('method.modelMae', null, lang);
    evalLabels[1].textContent = t('method.baselineMae', null, lang);
    evalLabels[2].textContent = t('method.directionAcc', null, lang);
  }
  setText('.roadmap .section-label', t('method.roadmapEyebrow', null, lang));
  setText('.roadmap h2', t('method.roadmapTitle', null, lang));
  setText('.roadmap p', t('method.roadmapBody', null, lang));

  // Footer
  const footerBrand = document.querySelector('footer > span:first-child');
  if (footerBrand) footerBrand.innerHTML = t('footer.brand', null, lang);
  setText('footer > a', t('footer.methodLink', null, lang));
}
