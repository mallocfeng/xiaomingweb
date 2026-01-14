# Production Dashboard Table Sizing Design

**Goal:** Ensure the middle table always displays all rows without being covered by other elements during resize, zoom, or maximize actions.

**Approach:** The table remains inside the existing grid layout and uses a dedicated sizing algorithm driven by `ResizeObserver`. We compute the available inner height of `.table-wrap` and derive a scale factor based on base header/row heights. The algorithm writes CSS variables for `--table-scale`, `--thead-height`, `--row-height`, and `--table-height`. CSS consumes these variables to scale font sizes and padding and to set row/header heights. This keeps the table content visible while preventing overlap with the bottom chart area. The table stays in the existing visual system, and the layout structure (left panel, top bar, charts) remains unchanged.

**Data Flow:** Resize or layout change triggers a sizing refresh. JS reads row count, available height, and base sizing variables, computes scaled heights, and updates CSS variables on `.table-wrap`. CSS then applies the scaled sizes to header cells, body cells, and row heights.

**Edge Cases:** If row count is zero or available height is invalid, we fall back to base sizes to avoid layout thrash. On extremely small heights, the scale factor may be small, but all rows remain visible by design.

**Testing:** Add unit tests for the sizing calculation function using Node's built-in test runner. Manual verification includes resizing window height, toggling maximize, and verifying no overlap with the chart panel.
