# Repository Guidelines

## Project Structure & Modules
- `src/`: App source. Key areas: `components/` (feature folders like `flow/`, `auth/`, `common/`), `config/firebase.js`, `contexts/` (e.g., `AuthContext.jsx`), `utils/pdfGenerator.js`.
- `public/`: Static assets served as‑is.
- `index.html`: Vite entry; mounts React app.
- `dist/`: Production build output (ignored by lint).
- Firebase config: `firebase.json`, `firestore.rules`, `firestore.indexes.json`.

## Build, Dev, and Lint
- `npm run dev`: Start Vite dev server with HMR.
- `npm run build`: Production build to `dist/`.
- `npm run preview`: Serve the built app locally.
- `npm run lint`: Run ESLint (JS/JSX, React Hooks, Vite refresh rules).
- Node 18+ recommended. Install deps with `npm ci` for reproducible installs.

## Coding Style & Naming
- 2‑space indent, ES Modules, functional React components.
- Components: PascalCase `.jsx` (e.g., `ProjectPage.jsx`). Utilities: camelCase `.js` (e.g., `pdfGenerator.js`). Hooks: `useX` naming.
- Keep files cohesive; prefer small, focused components. Avoid unused vars (ESLint enforced).
- Tailwind CSS v4 is available via `index.css`; prefer utility classes over ad‑hoc CSS.

## Testing Guidelines
- No test runner is configured yet. If adding tests, prefer Vitest + React Testing Library.
- Co‑locate tests next to code: `Component.test.jsx`, `utils/foo.test.js`.
- Mock Firebase (SDK mocks or Emulator). Keep tests deterministic; avoid network.

## Commit & Pull Request Guidelines
- History is minimal; follow Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`.
- Scope changes narrowly; one topic per PR. Include a clear description, linked issues, and UI screenshots/GIFs when relevant.
- Run `npm run lint` and ensure `npm run build` passes before opening a PR.

## Security & Configuration
- Use `.env.local` for secrets (not committed). Vite only exposes vars prefixed with `VITE_`.
- Example: `VITE_FIREBASE_API_KEY=...`, `VITE_FIREBASE_PROJECT_ID=...`.
- When changing `firestore.rules` or indexes, include rationale and testing notes (e.g., emulator steps) in the PR.
