# FX Warriors

A public, browser-based FX research demo for the AI6101 mini-project. Built with HTML, CSS, JavaScript modules and a bundled ECB reference-rate snapshot. No build step or API keys are required.

## Features

- Six currencies, selectable cross pairs, historical charts and CSV export.
- Five-, ten- and twenty-weekday illustrative forecasts, with an 80% normal-return model interval.
- A labelled keyword-based news scenario lab with editable basis-point assumptions.
- A fee-aware currency budget planner with browser-local saved scenarios and deletion controls.
- A model card and dynamically computed rolling evaluation against the no-change baseline.

## Model and data

The current snapshot contains 64 ECB daily reference observations from 2026-08-06 through 2026-11-03. Cross rates are derived from the same daily EUR reference table. Source: https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml

Daily drift is 25% of the mean of the latest 20 log returns. Volatility is the sample standard deviation of up to 60 returns. The model uses a normal-return approximation and is not a trained or calibrated AI model. The news classifier is keyword based; its suggested impact is a hypothetical assumption, not a causal estimate. Projection dates omit weekends but do not use a market holiday calendar.

The refresh action requests ECB-specific data from the Frankfurter public API. If the upstream service is unavailable, the dated bundled snapshot remains usable. Documentation: https://frankfurter.dev/

## Local preview

Run `node preview.mjs` and open the printed local address. Serve `dist/` as the static site root. Tests: `node tests/core.test.mjs`.

## Privacy

Saved budgets are held in the browser's local storage. No account, analytics or trade-execution service is used. The hosting provider and external data/font providers receive ordinary browser request metadata. Users can delete all saved plans in the app.

## Deployment

The Sites project identity is in `.openai/hosting.json`. Hosting runs on Cloudflare through Sites. Public access was explicitly requested by the user. The source and static artifact are prepared by the Sites source workflow before publication.
