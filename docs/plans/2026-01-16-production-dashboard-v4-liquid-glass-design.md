# Production Dashboard V4 - Warm Neutral Liquid Glass Refresh

## Context
The current `production-dashboard-v4.html` already has a warm palette and light glass effects. The goal is to push the interface toward a modern, quiet, liquid-glass aesthetic without changing layout, data flow, or behavior.

## Goals
- Elevate the visual system to a calm, contemporary liquid-glass style.
- Preserve layout, DOM structure, and data bindings.
- Improve depth, layering, and material feel while keeping legibility high.
- Keep performance stable (CSS-only changes where possible).

## Non-Goals
- No changes to data fetching, table sizing logic, or chart behavior.
- No feature additions or layout re-architecture.

## Visual Direction
Warm neutral minimalism with a subtle amber accent. The atmosphere is soft cream and fog gray with thin metallic edges and refractive highlights. Glass panels should feel layered, calm, and precise.

## Styling System
- Palette tokens: cream, fog, pearl, charcoal; restrained amber accent; mint for equipment state.
- Glass recipe: translucent fill, thin metallic edge, inner highlight line, micro-grain layer, and soft shadow.
- Background: gradient mesh + low-opacity liquid blobs + noise overlay; avoid flat fills.
- Typography: humanist Chinese-friendly body font and a compact numeric display font for metrics.

## Component Details
- Sidebar card, status card, stat cards, table, and charts use a shared glass recipe with slight tint variations.
- Logo block: satin gradient, reduced contrast, refined type.
- Progress bars: glass track with specular highlight on fill.
- Table header: glass strip with sharper accent edge; rows use faint warm striping.
- Charts: glass pane with soft halo; muted gridlines.

## Motion
- A single page-load reveal with staggered fades.
- A gentle shimmer on refresh, tuned to read as a glass sweep.
- Hover effects remain subtle and minimal.

## Responsiveness
Keep existing breakpoints; ensure glass blurs and backgrounds scale gracefully on small screens. Confirm table scroll hint remains visible.

## Data Flow and Behavior
No changes to JSON loading, refresh timing, event stream, or chart updates. JS remains intact.

## Testing
- Visual review: desktop, tablet, mobile.
- Confirm text contrast on glass panels.
- Verify refresh animation remains readable.
- Ensure layout and data bindings are unchanged.
