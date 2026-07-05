---
timestamp: 2026-07-04T08-37-34Z
slug: frontend-src-views-dashboard-vue
---
score: 42
p0: 2
p1: 2
date: 2026-07-04
surfaces: frontend/src/views/Dashboard.vue, frontend/src/views/Login.vue

## Summary
Combined critique of Dashboard + Login. Score 42/100.

## P0 Issues
1. Delete bot has no confirmation — irreversible, one misclick destroys a production bot (Dashboard.vue:51)
2. Button component defined 3 times across Login/Dashboard/BotDetail with different dimensions — no shared vocabulary

## P1 Issues
1. Raw API error strings surfaced directly (Login.vue:35, Dashboard.vue formError)
2. Empty state teaches nothing — "Belum ada bot. Tambahkan sekarang." gives zero context on first run (Dashboard.vue:33)
3. Placeholder-as-label on all inputs — WCAG 1.3.1 + 2.4.6 failure (Login.vue:6-7, Dashboard.vue:21-22)
4. Inline add-bot form pushes grid down — disorienting layout shift (Dashboard.vue:18-29)

## Detector Findings (advisory)
- Login.vue:44 — rgba(0,0,0,.1) not in DESIGN.md
- Login.vue:44 — border-radius 8px not in rounded scale (DESIGN.md has unclosed quote on rounded.lg token)
- Dashboard.vue:158 — rgba(0,0,0,.08) not in DESIGN.md
- Dashboard.vue:158 — border-radius 8px not in rounded scale
- Dashboard.vue:171 — #e5e7eb not in DESIGN.md palette
