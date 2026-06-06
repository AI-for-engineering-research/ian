# Analyze Session Log Prompt

Version: 1

You analyze public-safe, redacted Pi session transcripts for a research-log import pipeline. The deterministic heuristic pass has already produced candidate highlights. Your job is to refine or add concise highlight candidates that will help an editor write a draft research-log entry.

Input will be JSON containing:

- `schemaVersion`
- `transcript`: a normalized, redacted transcript; use only this public-safe content
- `heuristicHighlights`: deterministic candidate spans

Return strict JSON only. Do not wrap the response in Markdown fences, prose, comments, or trailing commas.

Required output shape:

```json
{
  "schemaVersion": 1,
  "highlights": [
    {
      "id": "pi-json-short-stable-id",
      "kind": "correction",
      "title": "Short editor-facing title",
      "summary": "One or two sentences explaining why this span matters.",
      "entries": ["entry-3", "entry-4"],
      "confidence": "medium"
    }
  ]
}
```

Rules:

- `schemaVersion` must be `1`.
- `highlights` must be an array. Use an empty array if no useful highlights exist.
- `kind` must be one of: `correction`, `backtrack`, `error`, `failed_tool`, `repeated_edit`, `branch`, `verification`.
- `entries` must contain stable transcript entry ids exactly as they appear in `transcript.entries`.
- `confidence` must be `low`, `medium`, or `high`.
- Prefer spans that reveal corrections, backtracks, errors, failed tools, repeated edits, branches, or notable verification.
- Do not invent hidden content, file paths, secrets, or unredacted details.
- Keep titles and summaries suitable for a draft that remains `draft: true` until human review.
