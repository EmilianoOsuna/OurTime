# Graph Report - OurTime  (2026-07-17)

## Corpus Check
- 213 files · ~426,881 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1570 nodes · 2218 edges · 197 communities (123 shown, 74 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 52 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ea867bc3`
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
- AuthContext.tsx
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
- Chat.tsx
- @capacitor/share
- @types/react
- 20260612190000_story_cover_position.sql
- 20260612190100_plan_calendar_events.sql
- 20260612230000_memory_position.sql
- 20260715000000_entitlements.sql
- .delete
- @capgo/capacitor-social-login
- react-colorful
- supabase
- index.ts
- @capacitor/app
- 20260717000000_ai_chat.sql
- Payments
- 2026-07-17T19-23-53Z__all.md
- Billing / Subscriptions
- Treasury / Financial Accounts
- SKILL.md
- @capacitor/camera
- @capacitor/core
- react-markdown

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 38 edges
2. `Icon()` - 29 edges
3. `useToast()` - 27 edges
4. `supabase` - 21 edges
5. `compilerOptions` - 20 edges
6. `react` - 17 edges
7. `compilerOptions` - 16 edges
8. `fmtDateShort()` - 15 edges
9. `Connect / platforms` - 15 edges
10. `StrategyHandler` - 14 edges

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

## Communities (197 total, 74 thin omitted)

### Community 0 - "AppShell.tsx"
Cohesion: 0.06
Nodes (38): AppShell(), Calendar, CAT_COLOR_STABLE, Dashboard, EditStorySheet, Finances, Gallery, getInitialTab() (+30 more)

### Community 1 - "StrategyHandler"
Cohesion: 0.14
Nodes (7): executeQuotaErrorCallbacks(), PrecacheStrategy, Strategy, StrategyHandler, timeout(), toRequest(), WorkboxError

### Community 2 - "usePushNotifications.ts"
Cohesion: 0.18
Nodes (13): CodeClient, getGoogleClientId(), GOOGLE_CLIENT_ID, GoogleCodeResponse, GoogleCredentialResponse, hasGoogleClientId(), loadGoogleIdentityServices(), renderGoogleSignInButton() (+5 more)

### Community 3 - "PlanDetail.tsx"
Cohesion: 0.09
Nodes (36): Tab, CAT_ICON, CatMedallion(), CAT_ICON, CatTag(), BackFn, pushBack(), removeBack() (+28 more)

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
Cohesion: 0.18
Nodes (21): MoneySheet(), NewMemorySheet(), Props, CAT_ICON, NewPlanSheet(), Props, CATEGORIES, FAMILY_ROLES (+13 more)

### Community 8 - "workbox-1e60b829.js"
Cohesion: 0.08
Nodes (28): addRoute(), CacheableResponse, CacheableResponsePlugin, cacheDonePromiseForTransaction(), cacheMatchIgnoreParams(), cacheWillUpdate(), canConstructResponseFromBodyStream(), copyResponse() (+20 more)

### Community 9 - "supabase.ts"
Cohesion: 0.16
Nodes (14): capacitorStorageAdapter, EntitlementType, isNative, MemoryType, NotificationType, PersonDisplay, StoryMemberType, TransactionType (+6 more)

### Community 10 - "compilerOptions"
Cohesion: 0.10
Nodes (20): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+12 more)

### Community 11 - "supabase"
Cohesion: 0.19
Nodes (15): btnBase, btnPrimary, btnSecondary, Paywall(), Props, TierCard, TIERS, isNative (+7 more)

### Community 12 - "common.sh"
Cohesion: 0.11
Nodes (4): get_current_branch(), get_feature_paths(), has_git(), common.sh script

### Community 13 - "Gallery.tsx"
Cohesion: 0.12
Nodes (12): AppInner(), AppShell, Auth, Onboarding, ConfirmFn, ConfirmOpts, ConfirmProvider(), Ctx (+4 more)

### Community 14 - "Onboarding.tsx"
Cohesion: 0.12
Nodes (6): COLORS, Confetti(), Category, CATS, genCode(), Onboarding()

### Community 15 - "PrecacheController"
Cohesion: 0.13
Nodes (7): createCacheKey(), generateURLVariations(), _nestedGroup(), PrecacheController, PrecacheRoute, printInstallDetails(), removeIgnoredSearchParams()

### Community 16 - "Profile.tsx"
Cohesion: 0.13
Nodes (17): CATS, Props, Segmented(), SegOpt, Ctx, CURRENCIES, CurrencyCtx, CurrencyKey (+9 more)

### Community 17 - "Tasks: [FEATURE NAME]"
Cohesion: 0.07
Nodes (26): Dependencies & Execution Order, Format: `[ID] [P?] [Story] Description`, Implementation for User Story 1, Implementation for User Story 2, Implementation for User Story 3, Implementation Strategy, Incremental Delivery, MVP First (User Story 1 Only) (+18 more)

### Community 18 - "Landing.tsx"
Cohesion: 0.12
Nodes (3): COUPLES, easeOut, PLANS

### Community 19 - "waitUntil"
Cohesion: 0.29
Nodes (3): CacheExpiration, dontWaitFor(), ExpirationPlugin

### Community 21 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, cap:build, cap:open, cap:sync, dev, lint, preview (+2 more)

### Community 23 - "get"
Cohesion: 0.30
Nodes (11): CORS, Interval, mapStatus(), planForPrice(), PlanTier, priceIdFor(), serviceClient(), stripe (+3 more)

### Community 24 - "data.jsx"
Cohesion: 0.14
Nodes (10): CATS, COUPLE, DIAS, MEMORIES, MESES, MESES_L, PLANS, TX (+2 more)

### Community 25 - "ui.jsx"
Cohesion: 0.15
Nodes (3): ToastCtx, ToastProvider(), useToast()

### Community 26 - "Icon.tsx"
Cohesion: 0.12
Nodes (17): DatePicker(), DIAS, MESES, Mode, parseSafe(), EditAction(), Props, Icon() (+9 more)

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
Nodes (13): autoprefixer, eslint, eslint-plugin-react-refresh, devDependencies, autoprefixer, eslint, eslint-plugin-react-refresh, tailwindcss (+5 more)

### Community 37 - ".delete"
Cohesion: 0.07
Nodes (28): Build automatizado, Build de release con minificacion, Build del AAB, CHECKLIST FINAL PRE-SUBIDA, Configuracion tecnica, Consentimiento en la app, Crear la app, Cuenta de desarrollador (+20 more)

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

### Community 46 - "index.ts"
Cohesion: 0.40
Nodes (3): CORS, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

### Community 48 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 52 - "CacheableResponsePlugin"
Cohesion: 0.33
Nodes (5): Fase 1: Cambios en la Base de Datos (Supabase), Fase 2: Crear el Backend del Asistente (Supabase Edge Functions), Fase 3: Modificaciones en el Frontend (React), Fase 4: Opciones de Experiencia de Usuario (Opcional), Plan de Migración: Chat a Asistente de IA (OurTime)

### Community 61 - "speckit.analyze.md"
Cohesion: 0.08
Nodes (25): 1. Initialize Analysis Context, 2. Load Artifacts (Progressive Disclosure), 3. Build Semantic Models, 4. Detection Passes (Token-Efficient Analysis), 5. Severity Assignment, 6. Produce Compact Analysis Report, 7. Provide Next Actions, 8. Offer Remediation (+17 more)

### Community 63 - "@capacitor/camera"
Cohesion: 0.10
Nodes (19): Account configuration: v2 dimensions, Business model to configuration mapping, Charge pattern selection, Compatibility constraints, Connect / platforms, Connected account capabilities (v2), Critical rules (never violate), Dashboard defaults (important) (+11 more)

### Community 64 - "@capacitor/cli"
Cohesion: 0.22
Nodes (9): @capacitor/cli, @capacitor/clipboard, @capacitor/filesystem, @capacitor/local-notifications, dependencies, @capacitor/cli, @capacitor/clipboard, @capacitor/filesystem (+1 more)

### Community 65 - "@capacitor/clipboard"
Cohesion: 0.11
Nodes (18): API Version Pairing, Backend Compatibility, Best Practice, Dynamically-Typed Languages (Ruby, Python, PHP, Node.js), Important Notes, iOS and Android SDKs, Loading Versioned Stripe.js, Migrating from v3 (+10 more)

### Community 69 - "@capacitor/filesystem"
Cohesion: 0.11
Nodes (16): Choosing a product tax code, Connect platforms and marketplaces, Diagnose zero tax, If jurisdictions are unknown, If the region or tax type isn’t supported, Per-integration setup, Registration safety, Table of contents (+8 more)

### Community 72 - "@capacitor/local-notifications"
Cohesion: 0.14
Nodes (13): Backend (`ai-chat` Edge Function), 📍 Fase 1: Contexto de Ubicación (Geolocalización), 🧠 Fase 2: Base de Datos del "Story Profile", 💬 Fase 3: El Onboarding Conversacional (La Entrevista), 🕵️ Fase 4: Extracción de Datos Inteligente (El Cerebro), 🤝 Fase 5: Fusión de Perfiles en el Prompt, Frontend (`Chat.tsx`), Frontend (`src/pages/Chat.tsx`) (+5 more)

### Community 80 - "OurTime — Plan de Monetización y Go-to-Market"
Cohesion: 0.09
Nodes (22): 1. ¿Qué es OurTime y por qué alguien pagaría?, 2. Modelo de negocio recomendado: Freemium + Suscripción, 3. Roadmap de funciones por fase de crecimiento, 4. Plan de marketing, 5. Competidores y diferenciadores, 6. Métricas clave a trackear desde el día 1, 7. Pasos inmediatos (esta semana), 8. Proyección de ingresos (conservadora) (+14 more)

### Community 83 - "Design System: OurTime"
Cohesion: 0.10
Nodes (19): 1. Overview, 2. Colors, 3. Typography, 4. Elevation, 5. Components, 6. Do's and Don'ts, Buttons, Cards (+11 more)

### Community 88 - "Constitución OurTime"
Cohesion: 0.13
Nodes (14): Constitución OurTime, Desarrollo y Workflow (SpecKit Flow), Gobernanza, I. Mobile-First / PWA, II. Privacidad y Datos, III. UX Premium / Editorial, IV. Simplicidad (YAGNI), Manejo de Datos (+6 more)

### Community 94 - "Feature Specification: [FEATURE NAME]"
Cohesion: 0.15
Nodes (12): Assumptions, Edge Cases, Feature Specification: [FEATURE NAME], Functional Requirements, Key Entities *(include if feature involves data)*, Measurable Outcomes, Requirements *(mandatory)*, Success Criteria *(mandatory)* (+4 more)

### Community 95 - "App.tsx"
Cohesion: 0.15
Nodes (12): API keys, Connect security, Incident response, IP restrictions, Mobile and client-side integrations, OAuth and CSRF protection, Restricted API keys (RAKs), SAML and SCIM (+4 more)

### Community 100 - "@types/node"
Cohesion: 0.08
Nodes (36): dispatchNavigation(), enableNativePushNotifications(), getCachedLocation(), getNativePushTarget(), hasLocationPermission(), refreshLocation(), requestLocationPermission(), savePushToken() (+28 more)

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
Cohesion: 0.18
Nodes (9): Architecture, Commands, Contexts, Data model (Supabase), Dual platform: PWA vs Capacitor, No router — state-machine navigation, Rules (IMPORTANT), Styling (+1 more)

### Community 138 - "Git Branching Workflow Extension"
Cohesion: 0.20
Nodes (9): Commands, Configuration, Disabling, Git Branching Workflow Extension, Graceful Degradation, Hooks, Installation, Overview (+1 more)

### Community 139 - "AuthContext.tsx"
Cohesion: 0.23
Nodes (10): CAT_OPTIONS, EditStorySheet(), Props, AuthContext, AuthContextType, AuthProvider(), indexEntitlements(), ProfileType (+2 more)

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
Cohesion: 0.21
Nodes (8): Avatar(), CoupleAvatars(), Person, useConfirm(), Gallery(), Memory, MemoryCard(), useColCount()

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

### Community 169 - "Chat.tsx"
Cohesion: 0.18
Nodes (10): CLI as Source of Truth, Error Handling, Project Variables, Step 1: Ensure Stripe CLI + Projects Plugin, Step 2: Search the Catalog, Step 3: Initialize a Project, Step 4: Hand Off to stripe-projects-cli, Step 5: Summarize and Suggest (+2 more)

### Community 181 - "20260715000000_entitlements.sql"
Cohesion: 0.50
Nodes (3): public.enforce_member_cap(), public.story_entitlements, trg_enforce_member_cap

### Community 182 - ".delete"
Cohesion: 0.17
Nodes (6): CacheFirst, cleanupOutdatedCaches(), NetworkFirst, printCleanupDetails(), StaleWhileRevalidate, waitUntil()

### Community 186 - "index.ts"
Cohesion: 0.16
Nodes (14): ANTHROPIC_KEY, callAnthropic(), CALLERS, callGemini(), callGroq(), callOpenAI(), CATEGORY_LABEL, ChatTurn (+6 more)

### Community 189 - "Payments"
Cohesion: 0.20
Nodes (9): API hierarchy, Deprecated APIs and migration paths, Dynamic payment methods, Integration surfaces, Payment Element guidance, Payments, PCI compliance, Saving payment methods (+1 more)

### Community 190 - "2026-07-17T19-23-53Z__all.md"
Cohesion: 0.22
Nodes (8): Anti-Patterns Verdict, Design Health Score, Minor Observations, Overall Impression, Persona Red Flags, Priority Issues, Questions to Consider, What's Working

### Community 191 - "Billing / Subscriptions"
Cohesion: 0.29
Nodes (6): Billing / Subscriptions, Recommended frontend pairing, Table of contents, Traps to avoid, Usage-based billing, When to use Billing APIs

### Community 192 - "Treasury / Financial Accounts"
Cohesion: 0.40
Nodes (4): Legacy v1 Treasury, Table of contents, Treasury / Financial Accounts, v2 Financial Accounts API

### Community 193 - "SKILL.md"
Cohesion: 0.50
Nodes (3): Process, Purchasing (only when the user wants to buy or consume a service), Stripe Directory Search

## Knowledge Gaps
- **665 isolated node(s):** `update-agent-context.sh script`, `auto-commit.sh script`, `create-new-feature.sh script`, `git-common.sh script`, `initialize-repo.sh script` (+660 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **74 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `@capacitor/cli`, `AppShell.tsx`, `overlays.jsx`, `ui.jsx`, `onboarding.jsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `BottomSheet()` connect `AppShell.tsx` to `react`, `useAuth`, `supabase`, `AuthContext.tsx`, `Profile.tsx`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `dependencies` connect `@capacitor/cli` to `package.json`, `react`, `@capacitor/share`, `dependencies`, `@capgo/capacitor-social-login`, `react-colorful`, `@capacitor/app`, `@capacitor/browser`, `@capacitor/camera`, `@capacitor/core`, `@capacitor/device`, `@capacitor/dialog`, `@capacitor/geolocation`, `@capacitor/haptics`, `react-markdown`, `@capacitor/network`, `@capacitor/preferences`, `@capacitor/push-notifications`, `@capacitor/screen-orientation`, `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/toast`, `framer-motion`, `lucide-react`, `react-dom`, `@supabase/supabase-js`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `update-agent-context.sh script`, `auto-commit.sh script`, `create-new-feature.sh script` to the rest of the system?**
  _665 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AppShell.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05656108597285068 - nodes in this community are weakly interconnected._
- **Should `StrategyHandler` be split into smaller, more focused modules?**
  _Cohesion score 0.14022988505747128 - nodes in this community are weakly interconnected._
- **Should `PlanDetail.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08843537414965986 - nodes in this community are weakly interconnected._