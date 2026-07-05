---
timestamp: 2026-07-04T12-55-34Z
slug: frontend-src-views-chatview-vue
---
---
score: 6.8
p0: 4
p1: 6
p2: 5
contrast_failures: 7
---

# ChatView.vue — Critique Snapshot

**Target:** `frontend/src/views/ChatView.vue`
**Date:** 2026-07-04
**Register:** Product (tool UI)

## Dimension Scores

| Dimension | Score |
|---|---|
| Visual Hierarchy | 7/10 |
| Color & Contrast | 6/10 |
| Typography | 7/10 |
| Layout & Spacing | 7/10 |
| Interaction States | 5/10 |
| Responsiveness | 4/10 |
| Empty/Loading States | 5/10 |
| Accessibility | 6/10 |

## P0 — Broken / Must Fix

- **P0-1** No focus ring on chat list items (`.wa-chat-item`) — keyboard users cannot see focus
- **P0-2** No focus ring on inputs (`.wa-input`, `.wa-search input`) — `outline:none` with only a 1px border-color change
- **P0-3** Mobile layout broken — `.wa-sidebar.hidden` toggled by CSS but no Vue ref or button to trigger it; sidebar permanently inaccessible after chat selection on mobile
- **P0-4** File preview DOM order inverted — `wa-file-preview` renders below `wa-send-error`; users can't find the attachment preview

## P1 — Significant Quality Gaps

- **P1-1** `#9ca3af` timestamps on white/`#efeae2` fail contrast (2.77:1 / 2.27:1; need 4.5:1)
- **P1-2** `#6b7280` preview text on white fails contrast (4.34:1; need 4.5:1)
- **P1-3** `#dc2626` error text on `#fef2f2` fails contrast (4.16:1; need 4.5:1)
- **P1-4** Placeholder text `#9ca3af` on `#f0f2f5` search input: 2.18:1 — severe failure
- **P1-5** Attach button (`<label>`) not keyboard-reachable — no `tabindex`, no `role="button"`
- **P1-6** No message send transition / optimistic UI — no motion confirms the action

## P2 — Polish

- **P2-1** Welcome empty state is bare — icon at 30% opacity + one line of text; teach the interface instead
- **P2-2** Loading state uses plain text "Memuat pesan..." — should be skeleton bubbles
- **P2-3** Status dot relies on `title` attribute for screen readers — unreliable; needs visually-hidden text
- **P2-4** No `@media (prefers-reduced-motion)` block — transitions exist without it
- **P2-5** Active chat item uses `background: #eef2ff` with no left-border or other strong affordance — selected state is subtle

## Contrast Failure Summary (WCAG AA)

| Pair | Ratio | Required | Pass |
|---|---|---|---|
| `#9ca3af` on `#ffffff` | 2.77:1 | 4.5:1 | FAIL |
| `#9ca3af` on `#efeae2` | 2.27:1 | 4.5:1 | FAIL |
| `#6b7280` on `#ffffff` | 4.34:1 | 4.5:1 | FAIL |
| `#6b7280` on `#f0f2f5` | 3.85:1 | 4.5:1 | FAIL |
| `#9ca3af` on `#f9fafb` | 2.36:1 | 4.5:1 | FAIL |
| `#9ca3af` on `#f0f2f5` | 2.18:1 | 4.5:1 | FAIL |
| `#4ade80` on `#4f46e5` (non-text) | 3.39:1 | 3:1 | PASS |
| `#dc2626` on `#fef2f2` | 4.16:1 | 4.5:1 | FAIL |

## Ban Violations

None detected.

## What's Working

- Solid semantic structure: `role="log"`, `aria-live="polite"`, `aria-label` on form and inputs
- WhatsApp-familiar visual language — avatar initials, bubble directions, message area bg — appropriate for the domain
- Search input with pill border-radius is consistent with the chat input affordance
- Indigo brand color (`#4f46e5`) applied consistently to primary actions, active states, and focus border
- `word-break: break-word` on bubbles prevents overflow on long URLs
- `text-overflow: ellipsis` on chat list names and previews — correct density behavior

## Persona Notes

**Alex (power user):** Keyboard navigation is broken at the first interaction point — no visible focus on chat items. Tab order likely jumps from search to chat buttons to input, but without focus rings Alex is flying blind. Send-on-Enter works (present). No keyboard shortcut to attach file.

**Sam (moderate skill):** Desktop path works with mild friction. File attach is confusing — the icon is small, the preview appears below the error zone, and the dismiss button is an unstyled `✕`. On mobile Sam selects a chat and cannot return to the list — the sidebar disappears with no back button.

**Casey (screen reader / keyboard):** `role="log"` + `aria-live` is correct and will announce incoming messages. Focus indicators are invisible (`outline:none`) — two P0 blockers. Attach label has no `tabindex` so it's skipped entirely in tab order. Status dot `title` attribute is unreliable across screen readers.
