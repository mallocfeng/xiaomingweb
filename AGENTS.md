# Agent Notes (xiaomingWeb)

This file orients agentic coding tools working in this repo.
It summarizes how to build/test and the local code conventions.

## Project snapshot
- Node.js 20+ (package.json engines)
- Express server in server/
- Static frontend in public/
- Tests in tests/ using node:test
- No lint or formatter configured

## Quick commands
```bash
npm install
npm run dev
npm run start
npm run test
```

## Build / run
- Dev server: `npm run dev` (NODE_ENV=development)
- Prod server: `npm run start` (NODE_ENV=production)
- Server entry: `server/index.mjs`
- Static assets: `public/`

## Tests
- All tests: `npm run test` (runs `node --test`)
- Single file: `node --test tests/filterUtils.test.mjs`
- Single test by name: `node --test --test-name-pattern "filter utils" tests/filterUtils.test.mjs`
- Example: `node --test tests/production-dashboard-table.test.mjs`

## Lint / format
- No ESLint/Prettier configured.
- Keep changes consistent with existing formatting (2 spaces, semicolons).
- Avoid reformatting unrelated code.

## Environment
- Copy `.env.example` to `.env` for local runs.
- Required: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, PORT
- Optional: DB_SCHEMA, DB_TABLE, DB_ENCRYPT, DB_SERVER_NAME
- Avoid committing secrets or credentials.

## Code organization
- `server/`: Express app, DB connection, query builder
- `public/`: static HTML/CSS/JS (ES modules)
- `tests/`: node:test unit tests (assert/strict)
- `docs/`: design notes and plans

## JavaScript style
- ES modules (`import` / `export`), repo is `type: module`.
- Use `const` by default; `let` when reassignment is required.
- Prefer arrow functions for callbacks; named functions for reusable logic.
- Semicolons are used; keep them.
- Indentation: 2 spaces.
- Trailing commas are uncommon; keep existing style.
- Use template literals for multi-line HTML strings.
- Keep functions small; extract helpers for repeated logic.

## Naming conventions
- camelCase for variables and functions.
- PascalCase for classes (rare in repo).
- SCREAMING_SNAKE_CASE for module constants.
- Filenames use kebab-case or existing naming (e.g., production-dashboard-v4.html).
- Server routes are lower-case with slashes (e.g., /api/search).

## Imports
- Group node built-ins first, then external deps, then local modules.
- Keep relative imports explicit with file extensions (.mjs).
- Avoid unused imports (no lint will catch it).

## Types and data handling
- No TypeScript in repo.
- Use defensive checks on inputs (null/undefined checks).
- Keep payloads JSON-friendly; sanitize/trim user inputs.
- In server routes, validate required fields and handle invalid JSON.

## Error handling
- Server: use try/catch and respond with status + JSON error.
- Client: surface errors in UI status text; log to console when needed.
- Avoid throwing raw DB errors to clients.
- Keep error messages short and actionable.

## API conventions
- JSON request/response.
- `/api/search` uses parameterized SQL (mssql request.input).
- Do not build raw SQL with user values directly.
- Limit query results (existing limit is capped at 500).

## Frontend conventions
- Vanilla JS modules, no bundler.
- DOM queries at top, then helpers, then event bindings.
- Prefer `textContent` for text, `innerHTML` for templated HTML only.
- Avoid expensive DOM updates in loops; build strings then assign once.
- Keep CSS variables in `:root` and reuse in components.

## Testing conventions
- Use `node:test` with `describe` / `it`.
- Use `node:assert/strict`.
- Keep tests deterministic; avoid network calls.
- Tests live in `tests/` and import from `public/` or `server/` modules.

## Files to be careful with
- `public/production-dashboard-*.html`: large HTML/CSS blocks.
- `public/styles.css`: keep design system consistent if edited.
- `server/query-builder.mjs`: SQL building logic.

## Patterns worth following
- DB connection pooling in `server/db.mjs`.
- Parameter binding with `request.input`.
- Validation and early returns for bad requests.

## Cursor / Copilot rules
- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found.
- If new rules are added later, update this file to include them.

## Agent workflow tips
- Run tests after modifying shared utilities or query logic.
- Keep diffs focused; avoid broad reformatting.
- When adding new UI, preserve the existing visual style per page.
- When adding endpoints, update README or docs if the contract changes.
