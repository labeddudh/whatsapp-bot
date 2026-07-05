---
name: WhatsApp Bot Manager
description: Developer tool for managing WhatsApp bot instances and API keys
colors:
  primary: "#4f46e5"
  primary-hover: "#4338ca"
  bg-main: "#f5f5f5"
  surface: "#ffffff"
  text-primary: "#1f2937"
  text-muted: "#6b7280"
  border: "#e5e7eb"
  border-input: "#d1d5db"
  border-light: "#f0f0f0"
  shadow-card: "rgba(0,0,0,0.08)"
  shadow-auth: "rgba(0,0,0,0.10)"
  secondary-btn: "#e5e7eb"
  danger-btn: "#fee2e2"
  error-bg: "#fef2f2"
  status-online: "#16a34a"
  status-qr: "#ca8a04"
  status-offline: "#dc2626"
  badge-green-bg: "#dcfce7"
  badge-yellow-bg: "#fef9c3"
  badge-red-bg: "#fee2e2"
  error: "#dc2626"
  code-bg: "#f5f5f5"
typography:
  body:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  heading:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "1.4rem"
    fontWeight: 600
    lineHeight: 1.2
  label:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
  code:
    fontFamily: "ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "99px"
spacing:
  xs: "0.35rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.25rem"
  2xl: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "#e5e7eb"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-danger:
    backgroundColor: "{colors.badge-red-bg}"
    textColor: "{colors.status-offline}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "1.25rem"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "0.6rem 0.8rem"
---

# Design System: WhatsApp Bot Manager

## 1. Overview

**Creative North Star: "The Utility Bench"**

This is a developer tool that gets out of the way. Utilitarian and direct, it uses clean defaults without decorative intent. The interface prioritizes legibility, clear state communication, and fast task completion over visual novelty. It's the bench in the workshop: sturdy, predictable, purpose-built.

**What this system rejects:** Overly playful consumer app patterns (gamification, excessive animation, emoji-heavy UI), dense enterprise dashboards that obscure the core workflow, flat gray lifeless utility tools that feel dated, and generic SaaS cream/beige landing page aesthetics with decorative gradient text or side-stripe borders.

**Key Characteristics:**
- One functional accent (indigo) used deliberately for primary actions
- System font stack for maximum legibility across platforms
- Minimal visual weight; surfaces are flat by default
- Semantic status colors (green/yellow/red) for connection state only
- Fast to parse at a glance when switching from code editor

## 2. Colors

Restrained utility palette: one functional accent, neutrals for hierarchy, semantic status colors for connection state.

### Primary
- **Functional Indigo** (#4f46e5 / oklch(54% 0.18 272)): Primary actions (buttons, header, key interactive elements). Used deliberately, not decoratively. Hover state darkens to #4338ca.

### Neutral
- **Main Background** (#f5f5f5 / oklch(97% 0 0)): Body background, neutral canvas.
- **Surface White** (#ffffff): Cards, forms, elevated containers.
- **Primary Text** (#333333 / oklch(27% 0 0)): Body copy, headings. Sufficient contrast (10:1) against white.
- **Muted Text** (#666666 / oklch(48% 0 0)): Secondary labels, supporting info. Meets 4.5:1 contrast minimum.
- **Border** (#dddddd): Input strokes, card separators.
- **Border Light** (#f0f0f0): Subtle dividers within cards (table rows, info sections).
- **Code Background** (#f5f5f5): Behind monospace API key display.

### Status (Semantic)
- **Online Green** (#16a34a / oklch(58% 0.17 145)): Connected bot state.
- **QR Yellow** (#ca8a04 / oklch(64% 0.15 85)): Awaiting QR scan state.
- **Offline Red** (#dc2626 / oklch(58% 0.22 25)): Disconnected state, error text.
- Status colors appear as badge backgrounds (light tints: #dcfce7, #fef9c3, #fee2e2) with the base color as text.

### Named Rules
**The Restrained Accent Rule.** The primary indigo is used on ≤15% of any given screen. It marks the primary action path and key interactive zones. Overuse dilutes its function.

## 3. Typography

**Body Font:** system-ui (with -apple-system, sans-serif fallback)
**Code Font:** ui-monospace (with monospace fallback)

**Character:** Native system fonts for zero latency and maximum legibility. No custom typefaces; the OS provides the best-tuned text rendering for each platform. Monospace for API keys and technical identifiers only.

### Hierarchy
- **Heading** (600 weight, 1.4rem / ~22px, 1.2 line-height): Page titles ("Bot Saya", "Status Koneksi"). Only one per screen.
- **Subheading** (600 weight, 1rem / 16px, 1.2 line-height): Card titles ("API Key", "Info"), section labels.
- **Body** (400 weight, 1rem / 16px, 1.5 line-height): Form labels, button text, paragraph content. Max line length not a concern; content is transactional, not prose.
- **Label** (400 weight, 0.875rem / 14px, 1.4 line-height): Supporting metadata (phone numbers, timestamps), helper text.
- **Code** (400 weight, 0.75rem / 12px, normal line-height): API keys, credential identifiers. Monospace family.

### Named Rules
**The One-Heading Rule.** Each screen has one h2-level heading at the top. Subheadings within cards use h3 styling but serve as labels, not titles. Hierarchy is flat by design.

## 4. Elevation

Minimal layering. Surfaces are flat by default; light shadows separate interactive containers from the background without creating strong depth cues.

### Shadow Vocabulary
- **Card Shadow** (`box-shadow: 0 1px 4px rgba(0,0,0,0.08)`): Default elevation for cards and form containers. Subtle ambient separation.
- **Auth Card Shadow** (`box-shadow: 0 2px 8px rgba(0,0,0,0.1)`): Slightly stronger shadow for the centered login/register card. Establishes focus.

### Named Rules
**The Flat-First Rule.** Surfaces are flat at rest. Shadows are minimal and serve only to establish container boundaries, not to simulate physical depth. No hover-lift effects; state changes are communicated through color, not z-axis motion.

## 5. Components

### Buttons
- **Shape:** Slightly rounded corners (6px radius)
- **Primary:** Indigo background (#4f46e5), white text, 0.5rem vertical × 1rem horizontal padding. Darkens to #4338ca on hover. No transition; instant feedback.
- **Secondary:** Light gray background (#e5e7eb), dark text (#333), same padding and radius. Used for "Batal" (cancel), "Kelola / QR" (secondary nav).
- **Danger:** Light red background (#fee2e2), red text (#dc2626), same padding and radius. Used for destructive actions ("Hapus", "Logout").
- **Icon Button:** No background, no border, minimal padding. Used for copy-to-clipboard icon (📋) next to API keys.
- **Disabled State:** 60% opacity, default cursor. No hover effect.

### Badges
- **Style:** Tiny text (0.75rem), 0.2rem vertical × 0.5rem horizontal padding, fully rounded (99px), 600 weight.
- **Variants:** Green (online), yellow (QR scan), red (offline). Light background with saturated text for sufficient contrast.
- **Purpose:** Connection status only. Not used for counts, labels, or other metadata.

### Cards
- **Corner Style:** 8px radius
- **Background:** White (#ffffff)
- **Shadow Strategy:** Subtle ambient (0 1px 4px rgba(0,0,0,0.08))
- **Border:** None; shadow defines the edge
- **Internal Padding:** 1.25rem uniform
- **Use:** Grouped content (bot list items, form containers, detail sections). Not nested.

### Inputs
- **Style:** 1px solid border (#dddddd), 6px radius, white background, 0.6rem vertical × 0.8rem horizontal padding.
- **Focus:** Browser default blue outline. No custom ring; the OS provides the clearest focus indicator.
- **Placeholder:** Inherits muted text color (#666). Must meet 4.5:1 contrast against white.
- **Error:** Red text (#dc2626) below the input. Input border remains default; error color is in the message, not the stroke.

### Navigation (Header)
- **Style:** Solid indigo background (#4f46e5), white text, 0.8rem vertical × 1.5rem horizontal padding. Spans full width.
- **Typography:** 600 weight for brand/page name, 400 weight for username and links. Font size 0.9rem for secondary elements.
- **Layout:** Flex row, space-between. Left: brand or back link. Right: username + logout button.
- **Logout Button:** Translucent white background (rgba(255,255,255,0.2)), white text, 0.35rem vertical × 0.8rem horizontal padding, 4px radius.

### API Key Display
- **Container:** Light gray background (#f5f5f5), 6px radius, 0.4rem vertical × 0.6rem horizontal padding. Flex row with icon button.
- **Code Text:** Monospace font, 0.75rem, truncated with ellipsis if too long. Dark text (#333) for legibility.
- **Copy Icon:** 📋 emoji as icon button. No tooltip; the icon is self-evident in context.

### Bot Grid
- **Layout:** CSS Grid, `repeat(auto-fill, minmax(280px, 1fr))`, 1rem gap. Responsive without breakpoints.
- **Card Content:** Vertical flex column, 0.75rem internal gap between sections (header, API key row, button row).

## 6. Do's and Don'ts

### Do:
- **Do** use the primary indigo (#4f46e5) only for primary actions and key interactive zones. Restrain to ≤15% of the screen.
- **Do** use semantic status colors (green/yellow/red) exclusively for connection state badges. Not for general UI accents.
- **Do** ensure body text hits ≥4.5:1 contrast. The current #333 on white is 10:1, which is safe. If using #666 muted text, verify it's only for secondary labels, never body copy.
- **Do** use monospace (ui-monospace) for API keys and technical identifiers. System fonts everywhere else.
- **Do** keep card shadows minimal (0 1px 4px). Stronger shadows feel heavy for a utility tool.
- **Do** use 6-8px border radius consistently. Slightly rounded, not sharp, not pill-shaped.

### Don't:
- **Don't** add side-stripe borders (colored border-left/right >1px) to cards or list items. This is the SaaS template cliché explicitly rejected.
- **Don't** use gradient text, glassmorphism, or decorative blur effects. This is a developer tool, not a consumer app.
- **Don't** nest cards. Each bot in the grid is one card; the form is one card. No card-within-card patterns.
- **Don't** add uppercase tracked eyebrows ("ABOUT" / "PROCESS" / "FEATURES") above every section. Section titles are sentence case, no small-caps scaffolding.
- **Don't** add motion for its own sake. No entrance animations, no scroll choreography, no hover-lift transforms. State changes are instant.
- **Don't** use decorative icons or illustrations. The only icon is the copy-to-clipboard emoji, and it's functional.
- **Don't** make the interface playful or casual beyond necessary friendliness. Avoid excessive emoji, playful microcopy, or gamification patterns that undermine the technical context.
- **Don't** create dense enterprise dashboard patterns with overwhelming tables, nested navigation, or feature bloat. Keep the workflow flat and obvious.
