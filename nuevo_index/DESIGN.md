---
name: Emerald Logic
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#9b3e3b'
  on-tertiary: '#ffffff'
  tertiary-container: '#ba5551'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ae'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#7f2928'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  gutter: 24px
  margin: 32px
---

## Brand & Style

This design system is built for precision, clarity, and reliability in operational environments. It targets logistics managers and warehouse administrators who require high-density information presented without cognitive overload. 

The aesthetic is **Corporate Modern with a Functional focus**. It leverages a "SaaS-Plus" feel—utilizing clean white surfaces, professional emerald accents to denote growth and stability, and a strict card-based hierarchy. The visual mood is calm and systematic, prioritizing data legibility and status awareness through purposeful color application and generous whitespace.

## Colors

The palette is anchored by **Emerald 600** (#059669), used for primary actions, success states, and positive inventory trends. 

- **Primary:** Emerald provides a professional, stable foundation for the brand.
- **Surface & Background:** We use a "Cool Grey" scale for backgrounds (#F8FAFC) to differentiate from pure white cards (#FFFFFF), creating a clear container-based hierarchy.
- **Status Colors:** These are non-negotiable for inventory management. **Red (Error)** is reserved strictly for "Out of Stock" or critical errors. **Amber (Warning)** indicates "Low Stock" or pending actions.
- **Neutral:** Slate tones are used for secondary text and borders to maintain high contrast without the harshness of pure black.

## Typography

The typography system utilizes **Inter** for its exceptional legibility and tabular numeric support, which is critical for inventory values and stock counts.

- **Data Visualization:** For currency and quantities, always enable tabular lining (`tnum`) to ensure numbers align vertically in tables.
- **Hierarchy:** Use `Headline-MD` for card titles. `Display-LG` is reserved for primary dashboard metrics like "Total Inventory Value."
- **Labels:** Small labels (`Label-MD`) should be uppercase with slight letter spacing to differentiate them from body text in dense forms.

## Layout & Spacing

The design system employs a **Fixed Grid** model on desktop (max-width: 1440px) to maintain data density without stretching charts into illegibility.

- **The 8px Grid:** All spacing between elements must be a multiple of 4px, with 8px and 16px being the standard increments for internal card padding.
- **Dashboard Layout:** A 12-column grid is used. Metrics occupy 3 or 4 columns, while large data tables and distribution charts occupy 8 or 12 columns.
- **Responsive Behavior:** On tablet, the grid shifts to 8 columns. On mobile, cards stack vertically with reduced side margins (16px) to maximize screen real estate for data.

## Elevation & Depth

We utilize **Tonal Layers** combined with **Ambient Shadows** to create a structured interface.

- **Level 0 (Background):** #F8FAFC. The canvas on which all elements sit.
- **Level 1 (Cards):** Pure white (#FFFFFF) with a soft, 1px border (#E2E8F0) and a very subtle ambient shadow (Y: 2px, Blur: 4px, Opacity: 0.05).
- **Level 2 (Dropdowns/Modals):** Increased shadow depth (Y: 8px, Blur: 16px, Opacity: 0.1) to indicate temporary overlay and focus.
- **Depth Cues:** Avoid heavy gradients. Depth is achieved through "ghost borders" and slight shifts in background greys.

## Shapes

The design system uses a **Soft (0.25rem)** roundedness approach. This maintains a professional, "engineered" look that feels modern but not overly casual or "bubbly."

- **Small Elements:** Checkboxes, tags, and small buttons use a 4px (0.25rem) radius.
- **Large Elements:** Dashboard cards and containers use 8px (0.5rem) to soften the large rectangular blocks of data.
- **Status Indicators:** Use a "pill" shape (999px) for status badges (e.g., "In Stock") to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Solid Emerald background, white text. No gradient. 
- **Secondary:** White background, Emerald border, Emerald text.
- **Export:** Distinctive style using a subtle grey fill to separate "system actions" from "primary business actions."

### Cards
- Every metric (e.g., Inventory Value) must be housed in a Level 1 Card. 
- Cards should have a consistent 24px internal padding.
- Metric cards include a "Trend Indicator" in the top right (small green/red text with an arrow).

### Data Tables
- Header rows should have a light grey background (#F1F5F9).
- Row height: 48px for standard density; 56px for data with images.
- Use thin #E2E8F0 horizontal dividers only; no vertical borders.

### Input Fields
- Use a 1px border (#CBD5E1). On focus, the border transitions to Emerald 600 with a 2px outer glow.
- Labels sit above the input in `Label-MD` style.

### Status Badges
- **Low Stock:** Soft Red background with Dark Red text.
- **Warning:** Soft Amber background with Dark Brown/Amber text.
- **In Stock:** Soft Emerald background with Dark Emerald text.