# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable product direction

- Match the live IQ Mentor interface and supplied screenshots one-to-one. Do not reinterpret, modernize, or add decorative design treatments.
- In the primary sidebar, replace the former Integrations entry with Settings.
- Settings must use existing IQ Mentor UI patterns. The entire LK settings group is intentionally omitted; keep the Analyst and Trainer sections working and clickable.
- In Settings, keep General neutral, use muted orange only as the Analyst accent, and use muted violet only as the Trainer accent; avoid large or bright color fills.
- All active Settings navigation rows use the same white background, neutral gray border, and dark text; category colors never tint the active-row background.
- Analyst and Trainer notification settings use the same Event / Display / Sound table layout; Analyst switches are muted orange and Trainer switches are muted violet, with independent working values.
- Settings → Analyst → Integrations contains Bitrix24, Yandex Disk, and amoCRM in one persistent service list with a contextual working detail panel. Service rows use recognizable brand logos with no secondary descriptions; preserve the supplied Yandex warning/OAuth flow and Bitrix token-management content.
- Put Documents under Settings → Общие and preserve the working document controls there; do not show Documents as a top-level sidebar destination.
- Put Employees under Settings → Общие and preserve the working employee controls there; do not show Employees as a top-level sidebar destination. Its department and table areas form one full-width surface joined by a single divider, flush with the Settings content bounds, without floating outer cards, horizontal drift, or clipped columns. On desktop, place Duplicate Search and Create Department in the same header row as the Employees title so the main workspace starts immediately below the header.
- Analyst and Trainer auto-report controls are full-width embedded Settings surfaces, not floating cards or overlays. Preserve the day/week/month toggles plus a single compact left-aligned Save button and Close behavior; do not add a Cancel button.
- Stereo call settings use one compact “Стереоформат звонков” dropdown with operator/client left-right presets. Do not show the former channel-recognition mode cards or separate channel-assignment controls. Its Save action matches the auto-report compact button styling, has no icon, and is left-aligned.
- Scoring settings are an embedded surface with minimum call duration, automatic analysis checkbox, Close/reset, and a compact left-aligned Save action. Do not restore the former category-weight sliders or strict-scoring toggle, and do not add a Back button inside Settings.
- Primary sidebar sections must be reorderable by holding the left mouse button and dragging. The dragged item follows the cursor, surrounding sections animate aside to expose a drop slot, and each user's chosen order persists locally between sessions.
- Keep a top-level “Тренер” sidebar destination with the source graduation-cap icon and chevron, positioned before “Настройки” by default and included in drag-and-drop ordering.
- On desktop, hovering a primary sidebar section should show a compact tooltip reading “Зажмите, чтобы переместить”; hide it immediately when the pointer leaves, while reordering, and on compact/mobile navigation.
- The current Home page source of truth is the supplied full analytics dashboard screenshot: use a compact header row, four vivid gradient KPI cards, a line chart, score-distribution donut, and three lower ranking/attention panels. Match its density, proportions, white surfaces, thin borders, and restrained typography while preserving the product's agreed navigation structure.
- Home dashboard widgets are user-reorderable by holding the left mouse button and dragging. Metrics, large charts, and summary cards reorder smoothly within their size-compatible rows, expose an animated landing slot, and persist each user's layout locally.
