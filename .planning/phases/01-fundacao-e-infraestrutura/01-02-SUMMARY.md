---
phase: 01-fundacao-e-infraestrutura
plan: "02"
subsystem: frontend-scaffold
tags: [vite, react, typescript, tailwind4, shadcn, vitest, pwa, zustand, tanstack-query, supabase]
status: complete
dependency_graph:
  requires:
    - 01-01 (Supabase project must exist; plan 02 itself has no Supabase dependency, but 01-03 depends on both)
  provides:
    - package.json (all Phase 1 dependencies)
    - vite.config.ts (react + tailwindcss + VitePWA plugins + @/* alias + vitest config)
    - tsconfig.json + tsconfig.app.json + tsconfig.test.json (@/* path alias)
    - src/index.css (Tailwind 4 CSS-first + shadcn @theme inline + MEIME brand tokens)
    - components.json (shadcn/ui config)
    - src/components/ui/ (button, input, label, alert, alert-dialog, separator, avatar)
    - src/lib/utils.ts (shadcn cn utility)
    - src/test/setup.ts + src/test/App.test.tsx (Vitest + jsdom smoke test)
    - src/App.tsx placeholder (replaced in Plan 04)
  affects:
    - 01-03 (auth integration — imports from @/lib/supabase.ts using @/* alias)
    - 01-04 (app shell and routing — uses shadcn components and Tailwind tokens)
    - All subsequent plans that add React components
tech_stack:
  added:
    - React 19.2.7 + React DOM 19.2.7
    - Vite 8.1.0 + @vitejs/plugin-react 6.0.2
    - TypeScript 6.0 (bundled via Vite template)
    - Tailwind CSS 4.3.2 + @tailwindcss/vite 4.3.2 (CSS-first, no tailwind.config.js)
    - shadcn/ui (Nova preset, Radix base, Geist font, Tailwind 4 + React 19 compatible)
    - React Router 8.0.1
    - Zustand 5.0.14
    - TanStack React Query 5.101.2
    - "@supabase/supabase-js 2.108.2"
    - vite-plugin-pwa 1.3.0
    - lucide-react 1.22.0
    - Vitest 4.1.9 + @testing-library/react + @testing-library/jest-dom + jsdom
  patterns:
    - Tailwind 4 CSS-first config via @import "tailwindcss" + @theme directive (no tailwind.config.js)
    - shadcn/ui --defaults init (Nova preset) + component add per component
    - Vitest defineConfig from vitest/config (extends Vite config with test block)
    - tsconfig.app.json excludes src/test — separate tsconfig.test.json for test files
    - @/* path alias in both Vite resolve.alias and tsconfig paths (required for editor + runtime)
    - ignoreDeprecations: "6.0" in tsconfig for baseUrl (TypeScript 6 deprecation)
key_files:
  created:
    - package.json
    - vite.config.ts
    - tsconfig.json
    - tsconfig.app.json
    - tsconfig.node.json
    - tsconfig.test.json
    - .gitignore
    - index.html
    - components.json
    - src/index.css
    - src/main.tsx
    - src/App.tsx (placeholder)
    - src/lib/utils.ts
    - src/test/setup.ts
    - src/test/App.test.tsx
    - src/components/ui/button.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx
    - src/components/ui/alert.tsx
    - src/components/ui/alert-dialog.tsx
    - src/components/ui/separator.tsx
    - src/components/ui/avatar.tsx
  modified: []
decisions:
  - "Scaffolded in project root via temp directory (create-vite interactive prompt blocks direct overwrite)"
  - "shadcn/ui initialized with --defaults flag (Nova preset, Radix base, Geist font) — avoids interactive prompts"
  - "vitest/config defineConfig used for vite.config.ts to get type-safe test block"
  - "tsconfig.app.json excludes src/test; separate tsconfig.test.json includes vitest/globals types"
  - "ignoreDeprecations: 6.0 added to both tsconfig files to silence TypeScript 6 baseUrl deprecation warning"
  - "Separate @theme block for MEIME tokens added after shadcn @theme inline block per Pitfall 1"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-06-29"
  tasks_completed: 2
  tasks_total: 2
  files_created: 22
  files_modified: 0
---

# Phase 01 Plan 02: React+Vite Scaffold Summary

**One-liner:** Vite 8 + React 19 + TypeScript 6 SPA scaffolded with Tailwind 4 CSS-first, shadcn/ui Nova preset (7 components), @/* path alias in Vite+TypeScript, vite-plugin-pwa manifest, and Vitest smoke test — all verified with `npm run build` (0 errors) and `npm run test -- --run` (1 passed).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Scaffold project + install all Phase 1 dependencies | bcb2d66 | package.json, vite.config.ts, tsconfig.json, tsconfig.app.json, tsconfig.node.json, .gitignore, index.html, src/main.tsx, src/App.tsx, src/index.css, public/ |
| 2 | Configure Tailwind 4 CSS-first + shadcn/ui + Vitest | 6aad139 | src/index.css, components.json, src/components/ui/ (7 files), src/lib/utils.ts, src/test/setup.ts, src/test/App.test.tsx, tsconfig.app.json, tsconfig.test.json |

## Verification Results

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| npm run build | Exit 0 | 0 errors, built in ~350ms | PASS |
| npm run test -- --run | 1 passed | 1 test, 1 passed | PASS |
| tailwind.config.js absent | NOT FOUND | NOT FOUND | PASS |
| postcss.config.js absent | NOT FOUND | NOT FOUND | PASS |
| components.json exists | present | present | PASS |
| src/components/ui/ has tsx files | >= 1 | 7 (button, input, label, alert, alert-dialog, separator, avatar) | PASS |
| tsconfig.app.json has @/* path | "@/*": ["./src/*"] | present | PASS |
| src/index.css has @import tailwindcss | first line | present | PASS |
| src/index.css has @theme inline (shadcn) | present | present | PASS |
| src/index.css has MEIME @theme tokens | --color-accent: #16A34A | present | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vite scaffold interactive prompt blocked direct overwrite**
- **Found during:** Task 1
- **Issue:** `npm create vite@latest . -- --template react-ts` cancelled when prompted about overwriting existing directory contents (`.git`, `.planning`, `supabase`)
- **Fix:** Scaffolded to `meime-temp/` subdirectory, then copied scaffold files to project root and removed temp dir
- **Files modified:** None (same output files)
- **Commit:** bcb2d66

**2. [Rule 3 - Blocking] TypeScript 6 `baseUrl` deprecation error**
- **Found during:** Task 1 (first build attempt)
- **Issue:** TypeScript 6.0 deprecated `baseUrl` and emits error TS5101; `npm run build` fails
- **Fix:** Added `"ignoreDeprecations": "6.0"` to both `tsconfig.json` and `tsconfig.app.json`
- **Files modified:** tsconfig.json, tsconfig.app.json
- **Commit:** bcb2d66

**3. [Rule 3 - Blocking] vite.config.ts `test` block caused TypeScript overload error**
- **Found during:** Task 1 (first build attempt)
- **Issue:** Vite's `defineConfig` doesn't accept `test` block; error TS2769 "Object literal may only specify known properties"
- **Fix:** Changed import from `vite` to `vitest/config` for `defineConfig` — this re-exports Vite's config but extends it with Vitest's `test` type
- **Files modified:** vite.config.ts
- **Commit:** bcb2d66

**4. [Rule 3 - Blocking] Test files included in production TypeScript build**
- **Found during:** Task 2 (build after creating src/test/App.test.tsx)
- **Issue:** tsconfig.app.json `"include": ["src"]` picked up src/test/*.tsx, causing TS2593 (cannot find 'describe', 'it', 'expect') since vitest/globals types were not in the app tsconfig
- **Fix:** Added `"exclude": ["src/test"]` to tsconfig.app.json; created tsconfig.test.json with vitest/globals and jest-dom types for test files
- **Files modified:** tsconfig.app.json (added exclude), tsconfig.test.json (new file)
- **Commit:** 6aad139

**5. [Rule 3 - Blocking] shadcn init interactive prompt not bypassed by --yes flag**
- **Found during:** Task 2
- **Issue:** `npx shadcn@latest init --yes --force` still prompted for "Select a component library" and "Which preset"
- **Fix:** Used `npx shadcn@latest init --defaults --force` which bypasses all prompts with default selections (Radix + Nova preset)
- **Files modified:** None (same output files as intended)
- **Commit:** 6aad139

## Known Stubs

- `src/App.tsx` — placeholder returning `<p>MEIME scaffold</p>`. Intentional stub per plan spec; replaced in Plan 04 (AppShell + routing).

## Threat Surface Scan

No new threat surface beyond the plan's threat model:
- T-1-02 (VITE_ env var exposure): No VITE_-prefixed variables added in this plan — Supabase keys are in Plan 03.
- T-1-SC (npm supply chain): All packages verified in RESEARCH.md Package Legitimacy Audit.

## Self-Check

Files verified:
- package.json: FOUND
- vite.config.ts: FOUND
- tsconfig.json: FOUND
- tsconfig.app.json: FOUND
- components.json: FOUND
- src/index.css: FOUND
- src/test/setup.ts: FOUND
- src/test/App.test.tsx: FOUND
- src/components/ui/button.tsx: FOUND

Commits verified:
- bcb2d66 (feat(01-02): scaffold Vite+React+TS project with all Phase 1 dependencies): FOUND
- 6aad139 (feat(01-02): configure Tailwind 4, shadcn/ui, and Vitest smoke test): FOUND

## Self-Check: PASSED
