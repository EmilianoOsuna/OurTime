# Graph Report - OurTime  (2026-07-15)

## Corpus Check
- 186 files · ~405,380 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1321 nodes · 1876 edges · 181 communities (108 shown, 73 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ebe95b5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AppShell.tsx
- StrategyHandler
- usePushNotifications.ts
- PlanDetail.tsx
- compilerOptions
- MainActivity
- ErrorBoundary
- useAuth
- workbox-1e60b829.js
- supabase.ts
- compilerOptions
- supabase
- common.sh
- Gallery.tsx
- Onboarding.tsx
- PrecacheController
- Profile.tsx
- Tasks: [FEATURE NAME]
- Landing.tsx
- waitUntil
- auth.ts
- scripts
- tweaks-panel.jsx
- get
- data.jsx
- ui.jsx
- Icon.tsx
- Router
- create-new-feature.sh
- CacheTimestampsModel
- app.jsx
- onboarding.jsx
- react
- create-new-feature.ps1
- create-new-feature.sh
- devDependencies
- .delete
- dashboard.jsx
- overlays.jsx
- generate-icons.mjs
- dateUtils.ts
- index.ts
- index.ts
- dependencies
- git-common.sh
- index.ts
- ExampleUnitTest.java
- gradlew
- PrecacheInstallReportPlugin
- git-common.ps1
- themeUtils.ts
- CacheableResponsePlugin
- NavigationRoute
- PrecacheCacheKeyPlugin
- Route
- icons.jsx
- auto-commit.sh
- initialize-repo.sh
- tsconfig.json
- speckit.analyze.md
- @capacitor/browser
- @capacitor/camera
- @capacitor/cli
- @capacitor/clipboard
- capacitor.config.ts
- @capacitor/device
- @capacitor/dialog
- @capacitor/filesystem
- @capacitor/geolocation
- @capacitor/haptics
- @capacitor/local-notifications
- @capacitor/network
- @capacitor/preferences
- @capacitor/push-notifications
- @capacitor/screen-orientation
- @capacitor/splash-screen
- @capacitor/status-bar
- @capacitor/toast
- OurTime — Plan de Monetización y Go-to-Market
- @eslint/js
- eslint-plugin-react-hooks
- Design System: OurTime
- framer-motion
- globals
- jsdom
- lucide-react
- Constitución OurTime
- react-dom
- @supabase/supabase-js
- @playwright/test
- postcss
- sharp
- Feature Specification: [FEATURE NAME]
- App.tsx
- @tailwindcss/postcss
- @testing-library/jest-dom
- @testing-library/react
- @testing-library/user-event
- @types/node
- @types/react-dom
- typescript
- typescript-eslint
- vite
- vite-plugin-pwa
- QA Report
- vitest
- update-agent-context.sh
- check-prerequisites.sh
- setup-plan.sh
- setup-tasks.sh
- 20260607_stories_architecture.sql
- speckit.plan.md
- speckit.specify.md
- speckit.tasks.md
- Product
- Core Principles
- Architecture
- Git Branching Workflow Extension
- MoneySheet.tsx
- 2026-07-15T05-26-42Z__src.md
- Create Feature Branch
- Create Feature Branch
- Implementation Plan: [FEATURE]
- speckit.checklist.md
- AuthContext.tsx
- speckit.clarify.md
- speckit.implement.md
- Coding Agent Context Extension
- Auto-Commit Changes
- Initialize Git Repository
- Detect Git Remote URL
- Validate Feature Branch
- Auto-Commit Changes
- Initialize Git Repository
- Detect Git Remote URL
- Validate Feature Branch
- 20260607_align_schema.sql
- speckit.constitution.md
- speckit.taskstoissues.md
- package.json
- [CHECKLIST TYPE] Checklist: [FEATURE NAME]
- Update Coding Agent Context
- React + TypeScript + Vite
- Update Coding Agent Context
- 20260613000000_update_schema.sql
- 20260612_integrations.sql
- graphify.md
- graphify.md
- @capacitor/core
- @capacitor/share
- @types/react
- 20260612190000_story_cover_position.sql
- 20260612190100_plan_calendar_events.sql
- 20260612230000_memory_position.sql

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 34 edges
2. `Icon()` - 27 edges
3. `useToast()` - 23 edges
4. `compilerOptions` - 20 edges
5. `supabase` - 19 edges
6. `react` - 17 edges
7. `compilerOptions` - 16 edges
8. `fmtDateShort()` - 15 edges
9. `StrategyHandler` - 14 edges
10. `PrecacheController` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Onboarding()` --references--> `react`  [EXTRACTED]
  public/design/onboarding.jsx → package.json
- `WaitStep()` --references--> `react`  [EXTRACTED]
  public/design/onboarding.jsx → package.json
- `NewPlanSheet()` --references--> `react`  [EXTRACTED]
  public/design/overlays.jsx → package.json
- `PlanDetail()` --references--> `react`  [EXTRACTED]
  public/design/overlays.jsx → package.json
- `ToastProvider()` --references--> `react`  [EXTRACTED]
  public/design/ui.jsx → package.json

## Import Cycles
- None detected.

## Communities (181 total, 73 thin omitted)

### Community 0 - "AppShell.tsx"
Cohesion: 0.06
Nodes (35): AppShell(), Calendar, CAT_COLOR_STABLE, Dashboard, EditStorySheet, Finances, Gallery, getInitialTab() (+27 more)

### Community 1 - "StrategyHandler"
Cohesion: 0.11
Nodes (7): NetworkFirst, PrecacheStrategy, StaleWhileRevalidate, Strategy, StrategyHandler, toRequest(), WorkboxError

### Community 2 - "usePushNotifications.ts"
Cohesion: 0.08
Nodes (37): CodeClient, getGoogleClientId(), GOOGLE_CLIENT_ID, GoogleCodeResponse, GoogleCredentialResponse, hasGoogleClientId(), loadGoogleIdentityServices(), renderGoogleSignInButton() (+29 more)

### Community 3 - "PlanDetail.tsx"
Cohesion: 0.08
Nodes (38): Tab, CAT_ICON, CatMedallion(), CAT_ICON, CatTag(), PresenceDot(), BackFn, pushBack() (+30 more)

### Community 4 - "compilerOptions"
Cohesion: 0.06
Nodes (30): DOM, DOM.Iterable, src, src/**/*.spec.*, src/**/*.test.*, src/**/__tests__, vite/client, compilerOptions (+22 more)

### Community 5 - "MainActivity"
Cohesion: 0.12
Nodes (15): ExampleInstrumentedTest, Test, Override, MainActivity, Override, OurTimeWidget, AppWidgetManager, AppWidgetProvider (+7 more)

### Community 6 - "ErrorBoundary"
Cohesion: 0.22
Nodes (3): ErrorBoundary, Props, State

### Community 7 - "useAuth"
Cohesion: 0.29
Nodes (12): EditStorySheet(), MoneySheet(), NewMemorySheet(), Props, CAT_ICON, NewPlanSheet(), Props, useAuth() (+4 more)

### Community 8 - "workbox-1e60b829.js"
Cohesion: 0.11
Nodes (15): addRoute(), CacheFirst, cacheWillUpdate(), canConstructResponseFromBodyStream(), copyResponse(), Deferred, executeQuotaErrorCallbacks(), precache() (+7 more)

### Community 9 - "supabase.ts"
Cohesion: 0.14
Nodes (18): Avatar(), CoupleAvatars(), Person, capacitorStorageAdapter, AlbumType, imageUrl(), isNative, MemoryType (+10 more)

### Community 10 - "compilerOptions"
Cohesion: 0.10
Nodes (20): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+12 more)

### Community 11 - "supabase"
Cohesion: 0.19
Nodes (11): CATEGORIES, FAMILY_ROLES, NewStorySheet(), Props, randomCode(), DatePicker(), DIAS, MESES (+3 more)

### Community 12 - "common.sh"
Cohesion: 0.11
Nodes (4): get_current_branch(), get_feature_paths(), has_git(), common.sh script

### Community 13 - "Gallery.tsx"
Cohesion: 0.19
Nodes (9): ConfirmFn, ConfirmOpts, ConfirmProvider(), Ctx, useConfirm(), Gallery(), Memory, MemoryCard() (+1 more)

### Community 14 - "Onboarding.tsx"
Cohesion: 0.12
Nodes (6): COLORS, Confetti(), Category, CATS, genCode(), Onboarding()

### Community 15 - "PrecacheController"
Cohesion: 0.15
Nodes (5): createCacheKey(), _nestedGroup(), PrecacheController, PrecacheRoute, printInstallDetails()

### Community 16 - "Profile.tsx"
Cohesion: 0.17
Nodes (13): Ctx, CURRENCIES, CurrencyCtx, CurrencyKey, CurrencyProvider(), storyKey(), connectGoogleCalendarWithCode(), CAT_COLOR (+5 more)

### Community 17 - "Tasks: [FEATURE NAME]"
Cohesion: 0.07
Nodes (26): Dependencies & Execution Order, Format: `[ID] [P?] [Story] Description`, Implementation for User Story 1, Implementation for User Story 2, Implementation for User Story 3, Implementation Strategy, Incremental Delivery, MVP First (User Story 1 Only) (+18 more)

### Community 18 - "Landing.tsx"
Cohesion: 0.12
Nodes (3): COUPLES, easeOut, PLANS

### Community 19 - "waitUntil"
Cohesion: 0.23
Nodes (6): CacheExpiration, cleanupOutdatedCaches(), dontWaitFor(), ExpirationPlugin, registerQuotaErrorCallback(), waitUntil()

### Community 21 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, cap:build, cap:open, cap:sync, dev, lint, preview (+2 more)

### Community 23 - "get"
Cohesion: 0.18
Nodes (12): CacheableResponse, cacheDonePromiseForTransaction(), get(), getCursorAdvanceMethods(), getIdbProxyableTypes(), getMethod(), has(), openDB() (+4 more)

### Community 24 - "data.jsx"
Cohesion: 0.14
Nodes (10): CATS, COUPLE, DIAS, MEMORIES, MESES, MESES_L, PLANS, TX (+2 more)

### Community 25 - "ui.jsx"
Cohesion: 0.15
Nodes (3): ToastCtx, ToastProvider(), useToast()

### Community 26 - "Icon.tsx"
Cohesion: 0.16
Nodes (12): EditAction(), Props, Icon(), IconComponent, ICONS, Segmented(), SegOpt, useCurrency() (+4 more)

### Community 28 - "create-new-feature.sh"
Cohesion: 0.20
Nodes (3): _extract_highest_number(), get_highest_from_branches(), create-new-feature.sh script

### Community 32 - "react"
Cohesion: 0.16
Nodes (10): react, CalendarScreen(), FinanceScreen(), GalleryScreen(), MoneySheet(), TweakNumber(), TweakRadio(), TweaksPanel() (+2 more)

### Community 33 - "create-new-feature.ps1"
Cohesion: 0.39
Nodes (7): ConvertTo-CleanBranchName(), Get-BranchName(), Get-HighestNumberFromBranches(), Get-HighestNumberFromNames(), Get-HighestNumberFromRemoteRefs(), Get-HighestNumberFromSpecs(), Get-NextBranchNumber()

### Community 34 - "create-new-feature.sh"
Cohesion: 0.25
Nodes (3): _extract_highest_number(), get_highest_from_branches(), create-new-feature.sh script

### Community 36 - "devDependencies"
Cohesion: 0.15
Nodes (13): autoprefixer, eslint, eslint-plugin-react-refresh, devDependencies, autoprefixer, eslint, eslint-plugin-react-refresh, supabase (+5 more)

### Community 37 - ".delete"
Cohesion: 0.29
Nodes (5): cacheMatchIgnoreParams(), generateURLVariations(), printCleanupDetails(), removeIgnoredSearchParams(), stripParams()

### Community 38 - "dashboard.jsx"
Cohesion: 0.43
Nodes (4): countdown(), NextHero(), romano(), TimelineRow()

### Community 40 - "generate-icons.mjs"
Cohesion: 0.29
Nodes (6): __dirname, icons, iconSize, maskablePath, publicDir, srcIcon

### Community 41 - "dateUtils.ts"
Cohesion: 0.52
Nodes (5): calculateCountdown(), calculateTimeTogether(), generateCalendarMatrix(), MONTH_NAMES, WEEK_DAYS

### Community 42 - "index.ts"
Cohesion: 0.29
Nodes (4): CORS, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GoogleTokenResponse

### Community 43 - "index.ts"
Cohesion: 0.48
Nodes (6): corsHeaders, FCM_SERVICE_ACCOUNT_B64, FCM_SERVICE_ACCOUNT_JSON, getFCMAccessToken(), getFCMServiceAccount(), sendFCM()

### Community 44 - "dependencies"
Cohesion: 0.29
Nodes (7): @capacitor/android, @capacitor/app, @capgo/capacitor-social-login, dependencies, @capacitor/android, @capacitor/app, @capgo/capacitor-social-login

### Community 46 - "index.ts"
Cohesion: 0.40
Nodes (3): CORS, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

### Community 48 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 61 - "speckit.analyze.md"
Cohesion: 0.08
Nodes (25): 1. Initialize Analysis Context, 2. Load Artifacts (Progressive Disclosure), 3. Build Semantic Models, 4. Detection Passes (Token-Efficient Analysis), 5. Severity Assignment, 6. Produce Compact Analysis Report, 7. Provide Next Actions, 8. Offer Remediation (+17 more)

### Community 80 - "OurTime — Plan de Monetización y Go-to-Market"
Cohesion: 0.09
Nodes (22): 1. ¿Qué es OurTime y por qué alguien pagaría?, 2. Modelo de negocio recomendado: Freemium + Suscripción, 3. Roadmap de funciones por fase de crecimiento, 4. Plan de marketing, 5. Competidores y diferenciadores, 6. Métricas clave a trackear desde el día 1, 7. Pasos inmediatos (esta semana), 8. Proyección de ingresos (conservadora) (+14 more)

### Community 83 - "Design System: OurTime"
Cohesion: 0.10
Nodes (20): 1. Overview, 2. Colors, 3. Typography, 4. Elevation, 5. Components, 6. Do's and Don'ts, Buttons, Cards / Containers (+12 more)

### Community 88 - "Constitución OurTime"
Cohesion: 0.13
Nodes (14): Constitución OurTime, Desarrollo y Workflow (SpecKit Flow), Gobernanza, I. Mobile-First / PWA, II. Privacidad y Datos, III. UX Premium / Editorial, IV. Simplicidad (YAGNI), Manejo de Datos (+6 more)

### Community 94 - "Feature Specification: [FEATURE NAME]"
Cohesion: 0.15
Nodes (12): Assumptions, Edge Cases, Feature Specification: [FEATURE NAME], Functional Requirements, Key Entities *(include if feature involves data)*, Measurable Outcomes, Requirements *(mandatory)*, Success Criteria *(mandatory)* (+4 more)

### Community 95 - "App.tsx"
Cohesion: 0.17
Nodes (8): AppInner(), AppShell, Auth, Onboarding, Ctx, Toast, ToastCtx, ToastProvider()

### Community 106 - "QA Report"
Cohesion: 0.17
Nodes (11): Accessibility Issues, Critical Issues, Functional Bugs, Issue QA-001, Issue QA-002, Issue QA-003, QA Report, Recommended Next Actions (+3 more)

### Community 131 - "20260607_stories_architecture.sql"
Cohesion: 0.26
Nodes (11): albums, memories, messages, notifications, plans, profiles, public.get_user_story_ids(), public.join_story_by_invite_code() (+3 more)

### Community 132 - "speckit.plan.md"
Cohesion: 0.18
Nodes (10): Completion Report, Done When, Key rules, Mandatory Post-Execution Hooks, Outline, Phase 0: Outline & Research, Phase 1: Design & Contracts, Phases (+2 more)

### Community 133 - "speckit.specify.md"
Cohesion: 0.18
Nodes (10): Completion Report, Done When, For AI Generation, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, Quick Guidelines, Section Requirements (+2 more)

### Community 134 - "speckit.tasks.md"
Cohesion: 0.18
Nodes (10): Checklist Format (REQUIRED), Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Phase Structure, Pre-Execution Checks, Task Generation Rules (+2 more)

### Community 135 - "Product"
Cohesion: 0.18
Nodes (10): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Platform, Positioning, Product, Product Purpose (+2 more)

### Community 136 - "Core Principles"
Cohesion: 0.18
Nodes (10): Core Principles, Governance, [PRINCIPLE_1_NAME], [PRINCIPLE_2_NAME], [PRINCIPLE_3_NAME], [PRINCIPLE_4_NAME], [PRINCIPLE_5_NAME], [PROJECT_NAME] Constitution (+2 more)

### Community 137 - "Architecture"
Cohesion: 0.20
Nodes (8): Architecture, Commands, Contexts, Data model (Supabase), Dual platform: PWA vs Capacitor, No router — state-machine navigation, Styling, What this is

### Community 138 - "Git Branching Workflow Extension"
Cohesion: 0.20
Nodes (9): Commands, Configuration, Disabling, Git Branching Workflow Extension, Graceful Degradation, Hooks, Installation, Overview (+1 more)

### Community 139 - "MoneySheet.tsx"
Cohesion: 0.24
Nodes (6): ITEMS, CATS, Props, BottomSheet(), Props, PlanType

### Community 140 - "2026-07-15T05-26-42Z__src.md"
Cohesion: 0.22
Nodes (8): Anti-Patterns Verdict, Design Health Score, Minor Observations, Overall Impression, Persona Red Flags, Priority Issues, Questions to Consider, What's Working

### Community 141 - "Create Feature Branch"
Cohesion: 0.22
Nodes (8): Branch Numbering Mode, Create Feature Branch, Environment Variable Override, Execution, Graceful Degradation, Output, Prerequisites, User Input

### Community 142 - "Create Feature Branch"
Cohesion: 0.22
Nodes (8): Branch Numbering Mode, Create Feature Branch, Environment Variable Override, Execution, Graceful Degradation, Output, Prerequisites, User Input

### Community 143 - "Implementation Plan: [FEATURE]"
Cohesion: 0.22
Nodes (8): Complexity Tracking, Constitution Check, Documentation (this feature), Implementation Plan: [FEATURE], Project Structure, Source Code (repository root), Summary, Technical Context

### Community 144 - "speckit.checklist.md"
Cohesion: 0.25
Nodes (7): Anti-Examples: What NOT To Do, Checklist Purpose: "Unit Tests for English", Example Checklist Types & Sample Items, Execution Steps, Post-Execution Checks, Pre-Execution Checks, User Input

### Community 145 - "AuthContext.tsx"
Cohesion: 0.32
Nodes (6): CAT_OPTIONS, Props, AuthContext, AuthContextType, AuthProvider(), StoryType

### Community 146 - "speckit.clarify.md"
Cohesion: 0.29
Nodes (6): Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, User Input

### Community 147 - "speckit.implement.md"
Cohesion: 0.29
Nodes (6): Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, User Input

### Community 148 - "Coding Agent Context Extension"
Cohesion: 0.29
Nodes (6): Coding Agent Context Extension, Commands, Configuration, Disable, Requirements, Why an extension?

### Community 149 - "Auto-Commit Changes"
Cohesion: 0.33
Nodes (5): Auto-Commit Changes, Behavior, Configuration, Execution, Graceful Degradation

### Community 150 - "Initialize Git Repository"
Cohesion: 0.33
Nodes (5): Customization, Execution, Graceful Degradation, Initialize Git Repository, Output

### Community 151 - "Detect Git Remote URL"
Cohesion: 0.33
Nodes (5): Detect Git Remote URL, Execution, Graceful Degradation, Output, Prerequisites

### Community 152 - "Validate Feature Branch"
Cohesion: 0.33
Nodes (5): Execution, Graceful Degradation, Prerequisites, Validate Feature Branch, Validation Rules

### Community 153 - "Auto-Commit Changes"
Cohesion: 0.33
Nodes (5): Auto-Commit Changes, Behavior, Configuration, Execution, Graceful Degradation

### Community 154 - "Initialize Git Repository"
Cohesion: 0.33
Nodes (5): Customization, Execution, Graceful Degradation, Initialize Git Repository, Output

### Community 155 - "Detect Git Remote URL"
Cohesion: 0.33
Nodes (5): Detect Git Remote URL, Execution, Graceful Degradation, Output, Prerequisites

### Community 156 - "Validate Feature Branch"
Cohesion: 0.33
Nodes (5): Execution, Graceful Degradation, Prerequisites, Validate Feature Branch, Validation Rules

### Community 157 - "20260607_align_schema.sql"
Cohesion: 0.40
Nodes (4): couples, notifications, plans, transactions

### Community 158 - "speckit.constitution.md"
Cohesion: 0.40
Nodes (4): Outline, Post-Execution Checks, Pre-Execution Checks, User Input

### Community 159 - "speckit.taskstoissues.md"
Cohesion: 0.40
Nodes (4): Outline, Post-Execution Checks, Pre-Execution Checks, User Input

### Community 160 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 161 - "[CHECKLIST TYPE] Checklist: [FEATURE NAME]"
Cohesion: 0.40
Nodes (4): [Category 1], [Category 2], [CHECKLIST TYPE] Checklist: [FEATURE NAME], Notes

### Community 162 - "Update Coding Agent Context"
Cohesion: 0.50
Nodes (3): Behavior, Execution, Update Coding Agent Context

### Community 163 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 164 - "Update Coding Agent Context"
Cohesion: 0.50
Nodes (3): Behavior, Execution, Update Coding Agent Context

### Community 165 - "20260613000000_update_schema.sql"
Cohesion: 0.67
Nodes (3): plans, public.is_story_admin(), story_members

## Knowledge Gaps
- **516 isolated node(s):** `update-agent-context.sh script`, `auto-commit.sh script`, `create-new-feature.sh script`, `git-common.sh script`, `initialize-repo.sh script` (+511 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **73 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `overlays.jsx`, `MoneySheet.tsx`, `dependencies`, `ui.jsx`, `onboarding.jsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `BottomSheet()` connect `MoneySheet.tsx` to `react`, `AppShell.tsx`, `useAuth`, `supabase`, `AuthContext.tsx`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`, `react`, `@capacitor/core`, `@capacitor/share`, `@capacitor/browser`, `@capacitor/camera`, `@capacitor/cli`, `@capacitor/clipboard`, `@capacitor/device`, `@capacitor/dialog`, `@capacitor/filesystem`, `@capacitor/geolocation`, `@capacitor/haptics`, `@capacitor/local-notifications`, `@capacitor/network`, `@capacitor/preferences`, `@capacitor/push-notifications`, `@capacitor/screen-orientation`, `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/toast`, `framer-motion`, `lucide-react`, `react-dom`, `@supabase/supabase-js`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `update-agent-context.sh script`, `auto-commit.sh script`, `create-new-feature.sh script` to the rest of the system?**
  _516 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AppShell.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06376811594202898 - nodes in this community are weakly interconnected._
- **Should `StrategyHandler` be split into smaller, more focused modules?**
  _Cohesion score 0.10953058321479374 - nodes in this community are weakly interconnected._
- **Should `usePushNotifications.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08383838383838384 - nodes in this community are weakly interconnected._