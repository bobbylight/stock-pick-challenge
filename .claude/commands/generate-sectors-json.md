# Generate sectors.json

Regenerate `updater-lambda/portfolios/sectors.json` — a JSON file mapping every stock ticker used across all years of the app to its sector and industry.

## Output format

The file is a sorted JSON array of objects:

```json
[
  { "ticker": "aapl", "sector": "Technology", "industry": "Consumer Electronics" },
  ...
]
```

- Sorted alphabetically by `ticker`
- Tickers are lowercase (matching the format used in portfolio JSON files)
- Sectors use standard GICS-style names: Technology, Healthcare, Financials, Consumer Discretionary, Consumer Staples, Communication Services, Industrials, Basic Materials, Utilities, Energy, Real Estate
- For ETFs (e.g. `icln`), use `"sector": "ETF"` and describe the ETF focus in the industry field
- Industries use the common classification style from Yahoo Finance / stockanalysis.com (e.g. "Biotechnology", "Software - Infrastructure", "Drug Manufacturers - General")

## Steps

1. **Collect all unique tickers** from every `carrow.json` and `robert.json` under `app/public/data/*/`:

   ```bash
   for f in app/public/data/*/carrow.json app/public/data/*/robert.json; do
     cat "$f" | python3 -c "import sys,json; [print(p['ticker']) for p in json.load(sys.stdin)['positions']]"
   done | sort -u
   ```

2. **Read the existing `sectors.json`** file to see which tickers already have entries.

3. **Identify new tickers** that are not yet in the file.

4. **Look up sector and industry** for each new ticker:
   - Use `WebSearch` and/or `WebFetch` to find the sector and industry
   - Good sources: `stockanalysis.com/stocks/<TICKER>/company/`, Yahoo Finance profile pages
   - Finviz pages are useful but may block direct fetching (403) — fall back to other sources
   - For well-known large-cap stocks (AAPL, MSFT, GOOGL, etc.), training data is reliable, but verify any you're unsure about
   - Web sources may change over time — if one source is unavailable, try another

5. **Merge new entries** into the existing array, maintaining alphabetical sort order.

6. **Write the updated file** to `updater-lambda/portfolios/sectors.json`.

7. **Report a summary** to the user: how many tickers total, how many were new, and list the new entries.

## Notes

- Some tickers may be delisted or acquired (e.g. `eigr` went bankrupt). Still include them — the file is a historical record of all tickers ever used.
- `sq` (Block) changed its ticker to `XYZ` in 2025 — keep it as `sq` since that's what appears in the historical data files.
- `goog` and `googl` are both Alphabet but different share classes — list both separately.
- If a company's sector/industry classification has changed (e.g. due to GICS reclassification), use the current classification.
