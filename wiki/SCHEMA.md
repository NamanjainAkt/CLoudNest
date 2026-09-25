# Wiki Schema & Conventions (CloudNest LLM Wiki)

> Source of synthesised truth for CloudNest. Raw sources (`WIKI.md`, `docs/`, code) are immutable inputs — never edit raw to match the wiki; update wiki pages when new facts arrive.

## Layout

- `wiki/index.md` — catalog of all pages. Keep in sync when adding/removing pages.
- `wiki/log.md` — append-only ingestion/change log. New entries go at the bottom as `## [YYYY-MM-DD] Title`.
- `wiki/<topic>.md` — entity pages, flat (no subfolders).

## Entity page format

1. H1 title + one-line scope.
2. `Sources:` line listing exact repo paths the page synthesises.
3. Dense facts with `path` references (no line numbers unless load-bearing).
4. `## Gaps` section only for verified defects (read the code first — no speculation).

## Rules

- Evidence before synthesis: read files before writing claims.
- Record verification commands actually run (tests, `tsc`, doctor) with date + result.
- Root `WIKI.md` and `docs/WIKI.md` are byte-identical duplicates — any fix must be applied to both until single-sourcing is adopted (see `known-gaps.md`).
- Stitch tokens are canonical in `stitch_cloudnest_ui_design_system/cloudnest_system/DESIGN.md`. Purple/violet hex is banned.
- Never log secrets: no API hashes, session strings, or key material in wiki pages.
