# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules (IMPORTANT)

- **NUNCA hacer `git push`** a este repositorio bajo ninguna circunstancia. El push lo hace siempre el usuario manualmente. Puedes hacer commits locales solo si el usuario lo pide, pero jamás subirlos.
- **No añadir el trailer `Co-Authored-By: Claude`** en los commits de este repo.

## What this is

OurTime ("Our Time") — a Spanish-language app for couples/friends/family to share plans, finances, photos, and chat. Ships as both a PWA and a Capacitor Android app from the same React codebase, backed by Supabase.

## Commands

```bash
npm run dev              # Vite dev server at http://localhost:5173
npm run build            # tsc -b && vite build (PWA build)
npm run lint             # eslint .
npm test                 # vitest run (unit tests in src/**/__tests__)
npm run test:watch       # vitest watch mode
npx vitest run src/lib/__tests__/dateUtils.test.ts   # single unit test file

npx playwright test                          # full E2E suite (starts dev server itself)
npx playwright test e2e/03-dashboard.spec.ts # single spec
npx playwright test --project=mobile-light   # one project (mobile-light | mobile-dark | desktop)

npm run cap:build        # VITE_CAPACITOR=true build + npx cap copy (Android build)
npm run cap:sync         # npx cap copy
npm run cap:open         # open Android Studio
```

E2E notes: tests log in against the **real Supabase backend** using credentials hardcoded in `e2e/helpers/auth.ts`; `e2e/global-setup.ts` saves auth state to `e2e/.auth/user.json`. Playwright runs with `workers: 1` (not parallel-safe — tests mutate shared account data). Requires `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `.env.example`).

## Architecture

### No router — state-machine navigation

There is no react-router. `src/App.tsx` renders one of: `Auth` → `Onboarding` (when user has 0 stories) → `AppShell`. `src/components/AppShell.tsx` is the hub: it owns the active tab (`home | calendar | gallery | finance | chat`), an `Overlay` union type for every sheet/detail view (plan detail, new-plan, money, memory, profile, new-story, edit-story, action sheet), and shared data (plans, memories) passed down to pages. Pages in `src/pages/` are lazy-loaded. PWA shortcut URLs (`/?shortcut=newplan|chat|memory`) seed the initial tab/overlay.

Back navigation (Android hardware back, sheet dismissal) goes through `src/lib/backStack.ts` + `setBackHandler` in `src/lib/native.ts`, not browser history.

### Data model (Supabase)

Everything hangs off a **story** (a shared space with category `pareja | amigos | familia | otro`, invite code, members). Users can belong to multiple stories; the active one is `activeStoryId` in `AuthContext`. Child tables all keyed by `story_id`: `plans` (with sub-plans via `parent_plan_id`), `memories`/`albums`, `messages`, `transactions`, `notifications`. Types live in `src/lib/supabase.ts`. Realtime subscriptions (`supabase.channel(...).on('postgres_changes', ...)`) drive live updates (chat, unread badge, presence). Migrations in `supabase/migrations/`, edge functions in `supabase/functions/` (`send-push`, `connect-google-calendar`, `sync-google-calendar`).

### Contexts

`AuthContext` (session, profile, stories, activeStoryId — the root data provider), `ToastContext`, `CurrencyContext`, `ConfirmProvider` (in `components/ui/ConfirmDialog.tsx`).

### Dual platform: PWA vs Capacitor

- `VITE_CAPACITOR=true` switches the build: relative `base`, PWA plugin disabled. Web builds get a service worker from `src/sw.ts` (injectManifest strategy) plus web push (`src/lib/pushSubscriptions.ts`, `usePushNotifications.ts`).
- All Capacitor plugin access is wrapped in `src/lib/native.ts` behind `isNative` guards — call its helpers instead of importing Capacitor plugins directly in components.
- Supabase auth uses PKCE; on native it swaps in `capacitorStorageAdapter` and deep-links back via `ourtime://callback`. Google sign-in is `@capgo/capacitor-social-login` on native, `src/lib/googleWeb.ts` on web.

### Styling

Design system is CSS custom properties in `src/index.css` (v3 "Vivo", look & feel inspired by mindmarket.com: cream paper `--paper` + pure-white cards `--card`, single sans Hanken Grotesk for both `--font-display`/`--font-ui` with tight tracking, drenched color blocks, generous radii `--r-*`, shadows `--sh-*`, signature `.squiggle` underline). Supporting block colors: `--orange` (accent, story-themable), `--blue`, `--done` (green), `--sun` (yellow, fixed dark ink `--sun-ink`/`--sun-soft`). Components use inline styles with these vars plus a small set of utility classes defined in `index.css` (`ot-card`, `eyebrow`, `display`, `field`, `skeleton`, `squiggle`, `hero-card`, …) — Tailwind is imported but its utility classes are essentially unused. Dark mode is `@media (prefers-color-scheme: dark)` overriding the vars, so **always use the vars, never hardcoded colors** (e.g. `var(--paper)`, not `#F4EFE3`). Hero surfaces (`--hero-bg`/`--hero-text`/`--hero-soft`) are drenched in the active accent in both modes; when a story sets `theme_color` (or a category override applies), `AppShell` recomputes `--hero-*` with `heroInk()` (luminance-based contrast pick) because `--hero-bg: var(--orange)` declared at `:root` resolves against `:root`, not scoped overrides.

All user-facing text is Spanish.
