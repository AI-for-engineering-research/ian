---
id: decision-1
title: Use redacted site-native Pi session transcripts for research logs
date: '2026-06-06 20:25'
status: Accepted
---
## Context

The course website will include research-log entries about interactions with Pi and other coding agents. A recurring source artifact will be Pi session JSONL logs. These logs are valuable because they preserve user prompts, assistant responses, tool calls, tool results, backtracking, corrections, and verification behavior, but they may also contain local paths, secrets, noisy tool output, and implementation details that should not be published verbatim.

The desired workflow is an `add-log` command that takes an original Pi JSONL session file, renders a full public transcript, runs an automated analysis pass to identify interesting interaction spans, and creates a draft MDX research-log page for manual editing.

## Decision

Build a site-native import pipeline for Pi JSONL logs rather than publishing raw JSONL or relying on Pi's standalone HTML export as the public artifact.

Key decisions:

- Treat raw JSONL as private source material. Copy it into a gitignored `.research-log-work/<slug>/raw-session.jsonl` directory for reproducibility.
- Generate public transcript data as a normalized, redacted, site-owned schema under `src/content/sessions/<slug>.json`.
- Render full transcripts as Astro pages at `/sessions/<slug>/` using reusable transcript components.
- Generate editable draft research-log pages at `src/content/log/<slug>.mdx` with links to transcript spans.
- Use the same explicit numeric slug for the log page and transcript, e.g. `002-pi-session-export-plan`.
- Keep generated pages as `draft: true` until redactions and commentary are reviewed.
- Use span-based highlights as the primary analysis unit, linking from generated MDX to stable transcript entry anchors.
- Run deterministic heuristic analysis first, then call Pi in JSON mode for an LLM analysis pass. Save prompts, normalized input, Pi JSON-mode output, and parsed analysis under `.research-log-work/<slug>/`.
- Make LLM analysis failure non-fatal by producing a heuristic/TODO draft page.
- Use the public-safe redacted/truncated transcript as the only input to the LLM analysis pass.
- Omit raw thinking blocks from public transcripts and analysis input.
- Redact local paths, Pi session paths, temporary paths, common API keys/tokens/secrets, suspicious environment variable values, and long blob/base64 strings. Do not redact email addresses by default.
- Truncate very large public tool outputs and collapse medium outputs in the UI.
- Render transcript message text as sanitized Markdown, never MDX.
- Validate generated public transcript JSON strictly with Zod and fail the site build if malformed.
- Version the analysis prompt in the repository, initially at `prompts/analyze-session-log.md`, and require structured JSON output.
- Support only original JSONL imports in v1, not already-exported HTML.

## Consequences

Positive consequences:

- Research-log claims can link to auditable full transcripts while preserving editorial control.
- The website can render transcripts consistently with its own layout, typography, navigation, and stable anchors.
- The normalized schema protects the site from Pi session-format changes and supports future non-Pi sources.
- Private intermediate artifacts make the import process reproducible without publishing raw logs.
- Draft-first generation reduces the risk of accidentally publishing sensitive or low-quality generated commentary.

Tradeoffs and limitations:

- The site will not exactly match Pi's `/export` HTML UI; it optimizes for course/research readability instead.
- The importer must maintain its own parser, redactor, transcript schema, and renderer.
- Some large tool outputs will be truncated in public transcripts, so “full transcript” means full redacted interaction structure, not every byte of every tool output.
- Branches will be rendered chronologically with light annotations in v1, not with a full interactive session-tree UI.
- LLM-generated highlights are provisional and require manual review before publication.

