# Release note candidate collector

`script/release_note_candidates.rb` is a release preparation helper for collecting links that a maintainer may want to review before writing GitHub Release notes.

It is intentionally a candidate collector only:

- It does not edit `CHANGELOG.md`.
- It does not decide the final release notes.
- It does not tag, publish, or create a GitHub Release.
- It does not replace the release preparation PR described in `docs/en/release.md`.

## Package verification boundary

This document is also part of the gem package verification surface. `script/check_gem_package_contents.rb` keeps the English and Japanese release-note candidate docs in the `Release note candidate docs` representative group so the built gem includes the maintainer review aid alongside the Release checklist. That package guard only checks that the docs are shipped; it does not turn the collector output into final release notes or release automation.

## Date window

Use a date window when you want GitHub Search to return merged pull requests and closed issues directly:

```bash
ruby script/release_note_candidates.rb --repo barnet-co-jp/tree_view-rails --since 2026-06-01
```

This mode queries:

- merged pull requests with `merged:>=YYYY-MM-DD`
- closed issues with `closed:>=YYYY-MM-DD`

Set `GITHUB_TOKEN` when you need a higher API rate limit or private repository access. Public repositories can usually be checked without a token, subject to GitHub API limits.

## Since tag

Use a tag when you want a local release review based on commit references after the previous release tag:

```bash
ruby script/release_note_candidates.rb --repo barnet-co-jp/tree_view-rails --since-tag v0.1.0
```

This mode compares the tag to `HEAD`, extracts `#123` style references from commit messages, and resolves those numbers as pull requests or issues. It is useful as a fallback when a date window is not obvious, but it only finds references that appear in commit messages.

## Output example

The script prints Markdown that is meant to be copied into release preparation notes, not committed as the final release text:

```markdown
# Release note candidates for barnet-co-jp/tree_view-rails

Source: closed or merged since 2026-06-01

This is a maintainer review aid. It does not rewrite CHANGELOG.md and does not decide the final release notes.

## Merged pull requests

- #1691 Persisted State cleanup guide entrypoints (2026-06-09T09:16:47Z)
  https://github.com/barnet-co-jp/tree_view-rails/pull/1691

## Closed issues

- #1549 Persisted State cleanup docs entrypoint (2026-06-09T09:16:48Z)
  https://github.com/barnet-co-jp/tree_view-rails/issues/1549
```

During the release preparation PR, paste or link this output as review evidence, then compare it with `CHANGELOG.md`, the merged PR history, and any release-facing compatibility notes. Keep only the human-approved highlights in GitHub Release notes.

## Review boundary

Treat the output as a checklist for maintainer review. During the release preparation PR, compare it with `CHANGELOG.md` and the merged PR history, then manually decide which items are notable enough for GitHub Release notes.
