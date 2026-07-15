# QA Report

## Summary

- Resultado general: No listo para release sin fixes. Web build/unit tests pass, but ESLint, Playwright, and Android lint all report blockers or release-risk items.
- Riesgos principales: Android lint blocks `./gradlew ... lint`; bottom sheet drag-close is broken for pointer/mouse interaction and leaves the modal intercepting clicks; OAuth/Google Identity emits 403/origin warnings; the E2E suite has multiple brittle selectors that hide real signal.
- Comandos ejecutados:
  - `python3 /home/emiliano_osuna/.codex/skills/qa-visual-functional-review/scripts/probe_project.py /home/emiliano_osuna/Projects/OurTime`
  - `npm run lint` failed: 79 errors, 12 warnings.
  - `npm test` passed: 5 files, 31 tests.
  - `npm run build` passed.
  - `npx cap doctor android` passed.
  - `./gradlew test lint assembleDebug` failed at `:app:lintDebug`; unit tests and debug APK build completed before lint aborted.
  - `adb devices` returned no attached devices.
  - `npx playwright test` failed: 304 passed, 12 failed, 2 flaky across `mobile-light`, `mobile-dark`, and `desktop`.

## Critical Issues

### Issue QA-001

- ID: QA-001
- Severidad: High
- Plataforma: Android
- Pantalla o ruta: Android build/lint
- Descripcion: Android lint fails with 4 errors, so CI/release lint cannot pass.
- Pasos para reproducir: Run `cd android && ./gradlew test lint assembleDebug`.
- Resultado esperado: Gradle test/lint/debug build completes successfully.
- Resultado actual: `:app:lintDebug` fails.
- Evidencia: `android/app/build/intermediates/lint_intermediate_text_report/debug/lintReportDebug/lint-results-debug.txt`
- Posible causa:
  - `MainActivity.java:61` calls `PackageInfo#getLongVersionCode()`, which requires API 28 while `minSdk` is 24.
  - `AndroidManifest.xml:30-34` marks a custom `ourtime://callback` scheme intent filter with `android:autoVerify="true"`, but Android App Links require `http(s)` and valid web domains.
  - `AndroidManifest.xml:70` requests camera permission without declaring `<uses-feature android:name="android.hardware.camera" android:required="false" />`.
- Sugerencia de fix: Gate version-code retrieval by SDK level or use compat APIs, remove `autoVerify` from custom scheme deep links or add real HTTPS app links separately, and declare camera hardware as optional if the app can run without a camera.

### Issue QA-002

- ID: QA-002
- Severidad: High
- Plataforma: Web
- Pantalla o ruta: Global action bottom sheet / FAB
- Descripcion: Dragging the bottom sheet handle with pointer/mouse events does not close the sheet; the still-open sheet intercepts the next click.
- Pasos para reproducir: Run `npx playwright test e2e/11-sheet-interactions.spec.ts --project=desktop` or use the failed full run.
- Resultado esperado: Dragging down closes the sheet and the next click on `Agenda` works.
- Resultado actual: Click on `Agenda` times out because a sheet `.ot-card` intercepts pointer events.
- Evidencia: `playwright-results/11-sheet-interactions-cerr-1782b-o-bloquea-el-siguiente-clic-desktop-retry1/test-failed-1.png`, trace in same folder.
- Posible causa: `src/components/ui/BottomSheet.tsx` only wires drag handlers to touch events (`onTouchStart`, `onTouchMove`, `onTouchEnd`), while desktop/pointer drag uses mouse events.
- Sugerencia de fix: Use pointer events or Framer Motion drag handling for the sheet handle, and keep the post-drag click recovery test.

### Issue QA-003

- ID: QA-003
- Severidad: Medium
- Plataforma: Web
- Pantalla o ruta: Google sign-in
- Descripcion: Login flow logs Google/OAuth related console errors.
- Pasos para reproducir: Run `npx playwright test e2e/09-accessibility.spec.ts`.
- Resultado esperado: No auth-related console errors during login.
- Resultado actual: Playwright captured `Failed to load resource: the server responded with a status of 403 ()`; desktop also captured `[GSI_LOGGER]: The given origin is not allowed for the given client ID.`
- Evidencia: `npx playwright test` console output.
- Posible causa: Local/test origin is not allowed in the configured Google OAuth client, or Google button resource/client setup is incomplete for the current environment.
- Sugerencia de fix: Verify authorized JavaScript origins and redirect URIs for local, staging, production, and Capacitor callback schemes.

## Visual Bugs

- No obvious layout-breaking visual bugs were confirmed in the validated screenshots. The visual screenshot suite passed for auth, dashboard, calendar, gallery, finances, chat, profile, action sheet, NewPlanSheet, MoneySheet, and NewStorySheet across mobile and desktop projects.
- Evidence screenshots: `playwright-review/*.png` (61 images regenerated during this run).

## Functional Bugs

- High: Android lint blocks release checks. Evidence: `android/app/build/reports/lint-results-debug.txt`.
- High: Bottom sheet drag-close with pointer/mouse leaves the action sheet open and blocks the next navigation click. Evidence: `playwright-results/11-sheet-interactions-cerr-1782b-o-bloquea-el-siguiente-clic-mobile-light-retry1/test-failed-1.png`.
- Medium: Google/OAuth console warnings during login. Evidence: Playwright console output from `e2e/09-accessibility.spec.ts`.
- Test reliability, not confirmed product bug: `e2e/05-gallery.spec.ts` clicks the center of the lightbox overlay, which lands on the image; `Lightbox` intentionally stops propagation on the image and provides a visible close button. Adjust the test to click the backdrop outside the image or the close button.

## Accessibility Issues

- Web automated accessibility/UX checks passed for title, auth labels, minimum touch target size, auth horizontal overflow, CSS variable presence, and font loading.
- Coverage is shallow: no axe/Lighthouse run was configured, and no manual screen reader pass was performed.
- Android accessibility could not be validated on-device because no emulator/device was attached.

## Test Coverage Gaps

- Que flujos no tienen pruebas:
  - Android connected UI tests, WebView runtime smoke, native permission flows, app links/custom scheme deep links, push notifications, camera/gallery upload, widget shortcuts, and real offline behavior.
  - Web tests do not strictly validate OAuth success/failure state with configured providers.
  - No automated axe/Lighthouse accessibility scan.
- Que pruebas conviene agregar primero:
  - Fix brittle Playwright locators for Google button and profile overlay before treating the suite as release-gating.
  - Add pointer/touch-specific bottom sheet tests using the correct interaction APIs.
  - Add a targeted lightbox close test that clicks the close button and a backdrop coordinate outside the image.
  - Add Android connected smoke tests or Maestro flows for launch, login, deep link handling, camera permission, and basic navigation.

## Recommended Next Actions

- Fix Android lint errors in `MainActivity.java` and `AndroidManifest.xml`, then rerun `cd android && ./gradlew test lint assembleDebug`.
- Fix bottom sheet pointer drag behavior in `src/components/ui/BottomSheet.tsx`.
- Fix E2E locator/test reliability issues:
  - Google button: use `getByRole('button', { name: /Continuar con Google/ })`.
  - Profile overlay: assert a specific heading or use `.first()` only if intentional.
  - Gallery lightbox: click the close button or backdrop outside the image.
  - Desktop partial-drag test: do not call `.tap()` in a non-touch project.
- Update ESLint ignores/config so generated `android/app/build`, `dev-dist`, and Playwright artifacts are not linted; then address remaining real source lint errors.
- Validate Android on an emulator/device after lint passes: launch, login, back gesture, custom scheme links, camera/photo permission, notification permission, and widget shortcuts.
