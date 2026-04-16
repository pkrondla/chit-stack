# Theming Guidelines

This project uses token-driven theming for both web apps:

- `chitstack-web/src/theme/tokens.js`
- `chitstack-global-web/src/theme/tokens.js`

## Rules

1. Do not hardcode hex colors in page/component source files.
2. Add new semantic colors to `semanticColors` in the app's `tokens.js`.
3. Keep Ant Design token overrides inside `appTokens` / `appTheme`.
4. If a CSS variable is needed, define it only in `src/index.css`.

## Guardrail

Both apps include `lint:theme`:

- `npm run lint:theme`

This script fails when hex colors are used outside approved files:

- `src/pages/**`
- Shared shell layouts:
  - `src/components/Layout.jsx`
  - `src/components/MemberLayout.jsx` (web app)

The main `npm run lint` command runs this check automatically.
