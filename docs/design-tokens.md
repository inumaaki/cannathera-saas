# Cannathera — Design Tokens

Exact values from client brand guide (`Desktop/Work - UMAR/00. chat with client 1.txt`).
Defined in `apps/web/src/app/globals.css` (CSS vars + Tailwind `@theme`) and `packages/ui/src/tokens.ts` (JS/TS).

## Palette

| Role | HEX | RGB | CSS var | Tailwind |
|------|-----|-----|---------|----------|
| Primary — Dark Green (logo, headers, footers) | `#0B4D34` | 11,77,52 | `--color-green-900` | `brand` |
| Secondary — Medium Green (hover, gradient mid, leaf, watermark) | `#1F7A4D` | 31,122,77 | `--color-green-700` | `brand-600` |
| Gradient end — Dark Green | `#0A3626` | — | `--color-green-950` | `brand-900` |
| Accent — Orange (CTAs, bullets, dividers) | `#F97316` | 249,115,22 | `--color-orange-500` | `accent` |
| Accent print-alt — Orange darker | `#E66A12` | — | `--color-orange-600` | `accent-print` |
| Background — Off-white | `#F8F8F6` | 248,248,246 | `--color-bg` | `surface` |
| Text — Dark Gray | `#1F2937` | 31,41,55 | `--color-text` | `ink` |
| Line — Light Gray | `#D9D9D9` | — | `--color-line` | `hairline` |

## Brand gradient
`linear-gradient(135deg, #0B4D34 0%, #1F7A4D 50%, #0A3626 100%)`
- CSS var: `--gradient-brand`
- Utility class: `.bg-brand-gradient`
- JS: `brandGradient` from `@cannathera/ui`

## Watermark
Client wants logo at **low opacity** in white content panels.
- Class `.cw-watermark` on a relatively-positioned white panel; `::before` renders `var(--watermark-image)` at opacity `0.05`, centered, non-interactive.
- Logo asset (`02. logo_bg_remove.png`) self-hosted; final placement wired in M2 with Figma.

## Fonts
- **Icon font:** Material Symbols Outlined (provided TTF) — self-host, no CDN (GDPR + offline).
- **UI font:** Inter (self-host) — `--font-sans` / `--font-inter`. Confirm vs Figma text styles.
- Light theme only for MVP (matches Figma). Dark mode out of scope.
