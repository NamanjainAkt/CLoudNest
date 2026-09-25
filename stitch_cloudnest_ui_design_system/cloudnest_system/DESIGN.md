---
name: CloudNest System
colors:
  surface: '#12131a'
  surface-dim: '#12131a'
  surface-bright: '#383941'
  surface-container-lowest: '#0d0e15'
  surface-container-low: '#1a1b22'
  surface-container: '#1e1f26'
  surface-container-high: '#292931'
  surface-container-highest: '#33343c'
  on-surface: '#e3e1ec'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e3e1ec'
  inverse-on-surface: '#2f3038'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#adc6ff'
  on-secondary: '#002e69'
  secondary-container: '#4b8eff'
  on-secondary-container: '#00285c'
  tertiary: '#ffb786'
  on-tertiary: '#502400'
  tertiary-container: '#df7412'
  on-tertiary-container: '#461f00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004493'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#12131a'
  on-background: '#e3e1ec'
  surface-variant: '#33343c'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 52px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.005em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.01em
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system delivers an ultra-clean, privacy-first personal cloud experience. It merges two high-precision design paradigms: Vercel’s razor-sharp, monochromatic developer aesthetic for dark environments and Apple's human-interface system architecture (Files/Settings) for light environments.

### Personality & Demographics
- **Target Audience:** Tech-fluent professionals, privacy advocates, designers, and engineers demanding absolute clarity, zero visual clutter, and uncompromising cryptographic trust.
- **Brand Attributes:** Architectural, silent, unyielding, hyper-legible, precise.
- **Emotional Signature:** A sense of absolute control, data sovereignty, and quiet efficiency. Interfaces must never scream; they recede into the background, prioritizing raw content and status indicators.

### Aesthetic Methodology
- **Dual-Mode Discretion:** Dark mode establishes an uncompromising, near-void obsidian space punctuated by hairline borders and precision glow. Light mode shifts to a structured, tactile canvas reminiscent of modern iOS/macOS system panels with soft neutral backdrops and high-contrast cards.
- **Micro-Precision Over Ornament:** Elimination of heavy drop shadows, decorative noise, and non-functional visual treatments. Structure is articulated strictly through delicate 1px borders, calibrated tonal stepping, and clear typographic hierarchy.

## Colors

The system uses a strict semantic mapping tailored to dark and light modes. Dark mode emphasizes near-black tonal gradation with hairline separation, while light mode delivers crisp, layered institutional neutrals.

### Dark Mode Architecture (Default)
- **Base Canvas (`bg-canvas`):** `#0A0A0A` — Void black canvas.
- **Surface Level 1 (`bg-surface`):** `#111111` — Sidebar, secondary trays, structural groupings.
- **Surface Level 2 (`bg-elevated`):** `#1A1A1A` — File cards, popovers, contextual tooltips, modal sheets.
- **Hairline Borders (`border-subtle`):** `#222222` — 1px division lines separating interactive and container bounds.
- **Active / Hover Borders (`border-strong`):** `#2E2E2E` — Hover indicators and active focus rings.
- **Text Primary (`text-primary`):** `#FAFAFA` — File titles, metrics, primary headers.
- **Text Secondary (`text-secondary`):** `#A1A1AA` — Metadata, file dimensions, timestamps, secondary navigation.
- **Text Muted (`text-muted`):** `#71717A` — Breadcrumbs, non-interactive states, placeholders.
- **Accent Primary (`accent`):** `#3B82F6` — Hyper-controlled focal points, sync confirmations, primary actions.

### Light Mode Architecture
- **Base Canvas (`bg-canvas`):** `#F2F2F7` — Grouped system canvas background.
- **Surface Level 1 (`bg-surface`):** `#FFFFFF` — Primary content modules, lists, file explorers.
- **Surface Level 2 (`bg-elevated`):** `#FFFFFF` — Modals, popovers, overlaid context menus.
- **Hairline Borders (`border-subtle`):** `#E5E5EA` — Subtle separators between system cells.
- **Active / Hover Borders (`border-strong`):** `#D1D1D6` — Interactive boundary hover.
- **Text Primary (`text-primary`):** `#000000` — High-contrast labels and headers.
- **Text Secondary (`text-secondary`):** `#6C6C70` — Timestamps, file details, paths.
- **Text Muted (`text-muted`):** `#8E8E93` — Inactive items, placeholder values.
- **Accent Primary (`accent`):** `#007AFF` — Primary interactive glyphs, selection states, highlights.

### Functional & Status Colors
- **Success / Encrypted:** `#10B981` (Dark) / `#34C759` (Light) — Cryptographic verified state, file synced.
- **Warning / Storage Threshold:** `#F59E0B` (Dark) / `#FF9500` (Light) — Storage quota approaching capacity.
- **Danger / Destructive:** `#EF4444` (Dark) / `#FF3B30` (Light) — Revoke share, permanent delete.

## Typography

The type system prioritizes optical clarity across dense data views, tabular file hierarchies, and encryption metadata displays.

### Hierarchy & Usage Rules
- **Display & Large Headlines:** Reserved exclusively for top-level root summaries, vault storage dashboards, and key onboarding surfaces. Rendered with tight tracking to maintain solid graphic density.
- **Section Headers (`headline-sm`, `headline-md`):** Used inside view toolbars, group splitters, and modal titles. Always semibold to maintain instant visual orientation against neutral backgrounds.
- **Body (`body-lg`, `body-md`):** `body-md` (13px) acts as the workhorse size for all file listings, nested tree labels, breadcrumb text, and form descriptions.
- **Technical & Cryptographic Data (`mono-sm`):** Rendered strictly in a monospaced typeface (`JetBrains Mono`) for file hashes, CID keys, byte sizes, and IPFS multihashes to ensure vertical column alignment.
- **OpenType Adjustments:** Enforce `font-feature-settings: "cv02", "cv03", "cv04", "cv11", "tnum"` for numerical data columns, ensuring numeric alignment across file sizes and transfer speeds.

## Layout & Spacing

The layout model is driven by a unified utility framework optimized for density, structured navigation, and dynamic multi-pane views.

### Structure & Responsive Adapters
- **Desktop (1024px+):** Fixed structural multi-pane workspace.
  - Left navigation: Fixed width (240px) collapsible down to a slim icon rail (64px).
  - Main file stage: Fluid layout spanning the remainder of the viewport, supporting grid (cards) or list (tabular) configurations.
  - Contextual detail inspector: Fixed width (320px) on the right edge, toggleable, rendering metadata, sharing rights, and cryptographic activity.
- **Tablet (768px – 1023px):**
  - Left navigation collapses into an overlay drawer.
  - Main workspace consumes full width; inspector drawer slides over the canvas upon item selection.
- **Mobile (< 768px):**
  - Bottom navigation bar replacing the sidebar.
  - Inspector moves to a native bottom sheet modal.
  - Content shifts to single-column lists with edge-to-edge separators.

### Spacing Rationale
A compact base rhythm keeps file counts dense without visual crowding. Element gaps inside toolbars and button clusters rely on `space-sm` (8px) and `space-md` (12px), keeping actions close to content anchors. Inner card padding uses `space-lg` (16px) for breathable file previews.

## Elevation & Depth

This design system eschews heavy physical drop shadows, relying instead on hairline borders and tonal stepping to communicate hierarchy.

### Depth Mechanics
- **Dark Mode Elevation:**
  - Base layer sits at `#0A0A0A`.
  - Cards, panels, and sidebars elevate to `#111111` or `#1A1A1A`.
  - Elevation is delimited strictly by a 1px border (`#222222`).
  - Floating menus and tooltips introduce a calibrated hairline border highlight: `box-shadow: 0 0 0 1px #222222, 0 8px 24px -4px rgba(0, 0, 0, 0.6)`.
- **Light Mode Elevation:**
  - Base canvas sits at `#F2F2F7`.
  - Primary content blocks sit on clean white (`#FFFFFF`) surfaces.
  - Inter-surface boundaries use a crisp 1px `#E5E5EA` border.
  - Modals and floating sheets utilize frosted glass translucent layers (`backdrop-filter: blur(20px) saturate(180%)`) paired with an ultra-subtle directional shadow: `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 6px 16px rgba(0, 0, 0, 0.06)`.

## Shapes

The interface blends Apple’s smooth pill geometry for interactive elements with precise, bounded corners for structural modules.

### Geometry Hierarchy
- **Pills (`rounded-full` / `3rem`):** Buttons, interactive filter chips, badges, and search inputs inherit full capsule curvature. This provides an immediate tactile cue distinguishing interactive targets from content frames.
- **Panels & Cards (`rounded-lg` / `1rem`):** File preview cards, inspector blocks, settings sections, and modal views use soft Apple-style squircle approximations (`12px` to `16px`), balancing capsule buttons with clean framing.
- **Selection Rows (`rounded-md` / `0.5rem`):** Tabular item lists and sidebar navigation items employ tight, micro-rounded edges to preserve alignment across dense lists.

## Components

### Buttons
- **Primary:** Full pill geometry (`rounded-full`). Dark mode: Solid `#FAFAFA` with `#0A0A0A` text, hovering to `#E4E4E7`. Light mode: Solid `#007AFF` with `#FFFFFF` text, hovering to `#0062CC`. Height: 36px (Desktop), 42px (Mobile).
- **Secondary / Outline:** Pill geometry. 1px border (`#222222` dark / `#E5E5EA` light). Background transparent or surface subtle (`#111111` / `#FFFFFF`).
- **Ghost:** No border, background transparent, active hover transitions to `#1A1A1A` (Dark) / `#E5E5EA` (Light).

### Chips & Filter Pills
- Encapsulated pills (`rounded-full`) used for file extension filters, sharing scopes (Private, Shared, Public), and storage categories.
- Inactive: Background `#111111` (Dark) / `#E5E5EA` (Light), border 1px subtle.
- Active: Accent filled with high-contrast text and 1px matching accent border.

### File List Items & Data Rows
- **List View:** Single-line data rows with strict column layout (Icon + Name, Tags, Size, Last Modified, Context Menu). Separated by 1px hairline horizontal border.
- Hover state triggers subtle background shift (`#111111` dark / `#F9F9FB` light).
- Selected state adds a 1px ring or left accent indicator bar.

### File & Folder Cards (Grid View)
- Bounded by 1px hairline border, `12px` corner radius.
- Top section: 16:9 or 1:1 preview area with deep black or neutral container.
- Bottom section: File name, extension pill badge, and relative sync status icon.

### Form Inputs & Search Fields
- Fully rounded pill search fields (`rounded-full`) with left-aligned minimal Lucide magnifying glass (16px, `#71717A`).
- Background: `#111111` (Dark) / `#FFFFFF` (Light), bounded by 1px `#222222` / `#E5E5EA`.
- Focus state: Border transitions to primary accent color (`#3B82F6` / `#007AFF`), no glow or halo.

### Checkboxes & Radios
- Checkboxes: Small rounded square (`4px` radius), 16px dimension. Unchecked: 1px border `#71717A`. Checked: Solid accent color with crisp white checkmark.
- Radios: Standard circle, 16px dimension with a centered 6px dot upon selection.

### Cloud-Specific Components
- **Encryption Shield Badge:** Minimal shield glyph displaying active zero-knowledge encryption status. Solid green indicator for verified local encryption keys.
- **Storage Meter Bar:** Slim 4px pill-shaped progress track (`#1A1A1A` dark / `#E5E5EA` light) with accent fill indicating consumption tiers.
- **File Transfer Pill:** Persistent bottom floating capsule summarizing active uploads and sync status with spinning vector ring.