import { test, expect } from '@playwright/test'
import { loginUser } from './helpers/auth'

test.describe('Visual — Screenshots exhaustivos de todas las pantallas', () => {
  test('auth: welcome screen (light)', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Crear cuenta')).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(700) // animations settle
    await page.screenshot({ path: 'playwright-review/visual-01-welcome.png' })
  })

  test('auth: register screen', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Crear cuenta/i }).click()
    await expect(page.locator('h1').first()).toContainText('Crea tu', { timeout: 5_000 })
    await page.getByPlaceholder('Mateo').first().fill('Emiliano')
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'playwright-review/visual-02-register.png' })
  })

  test('auth: login screen', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Ya tengo cuenta — Iniciar sesión').click()
    await expect(page.getByPlaceholder('mateo@correo.com')).toBeVisible()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'playwright-review/visual-03-login.png' })
  })

  test('auth: forgot password screen', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Ya tengo cuenta — Iniciar sesión').click()
    await page.getByText('¿Olvidaste tu contraseña?').click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'playwright-review/visual-04-forgot.png' })
  })

  test('app: dashboard (tab Inicio)', async ({ page }) => {
    await loginUser(page)
    await page.locator('nav').last().getByText('Inicio').click()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'playwright-review/visual-05-dashboard.png', fullPage: true })
  })

  test('app: calendar (tab Agenda)', async ({ page }) => {
    await loginUser(page)
    await page.getByText('Agenda').click()
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'playwright-review/visual-06-calendar.png', fullPage: true })
  })

  test('app: gallery (tab Fotos)', async ({ page }) => {
    await loginUser(page)
    await page.getByText('Fotos').click()
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'playwright-review/visual-07-gallery.png', fullPage: true })
  })

  test('app: finances (tab Gasto)', async ({ page }) => {
    await loginUser(page)
    await page.getByText('Fondo', { exact: true }).click()
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'playwright-review/visual-08-finances.png', fullPage: true })
  })

  test('app: chat (tab Chat)', async ({ page }) => {
    await loginUser(page)
    await page.getByText('Ideas').click()
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'playwright-review/visual-09-chat.png', fullPage: true })
  })

  test('app: profile overlay', async ({ page }) => {
    await loginUser(page)
    await page.getByText('Yo').click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: 'playwright-review/visual-10-profile.png', fullPage: false })
  })

  test('app: GlobalActionSheet (FAB)', async ({ page }) => {
    await loginUser(page)
    await page.locator('[data-testid="fab-btn"]').click()
    await expect(page.getByText('¿Qué añadimos?')).toBeVisible()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'playwright-review/visual-11-action-sheet.png', fullPage: false })
  })

  test('app: NewPlanSheet', async ({ page }) => {
    await loginUser(page)
    await page.locator('[data-testid="fab-btn"]').click()
    await page.getByText('Nuevo momento').click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'playwright-review/visual-12-new-plan.png', fullPage: false })
  })

  test('app: MoneySheet', async ({ page }) => {
    await loginUser(page)
    await page.locator('[data-testid="fab-btn"]').click()
    await page.getByText('Nuevo movimiento').click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'playwright-review/visual-13-money-sheet.png', fullPage: false })
  })

  test('app: NewStorySheet', async ({ page }) => {
    await loginUser(page)
    await page.locator('[data-testid="fab-btn"]').click()
    await page.getByText('Nueva historia').click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'playwright-review/visual-14-new-story.png', fullPage: false })
  })
})

test.describe('Visual — Dark mode', () => {
  test.use({ colorScheme: 'dark' })

  test('dark: welcome screen', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Crear cuenta')).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(700)
    await page.screenshot({ path: 'playwright-review/dark-01-welcome.png' })
  })

  test('dark: login screen', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Ya tengo cuenta — Iniciar sesión').click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'playwright-review/dark-02-login.png' })
  })

  test('dark: dashboard', async ({ page }) => {
    await loginUser(page)
    await page.locator('nav').last().getByText('Inicio').click()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'playwright-review/dark-03-dashboard.png', fullPage: true })
  })

  test('dark: action sheet', async ({ page }) => {
    await loginUser(page)
    await page.locator('[data-testid="fab-btn"]').click()
    await expect(page.getByText('¿Qué añadimos?')).toBeVisible()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'playwright-review/dark-04-action-sheet.png' })
  })

  test('dark: profile overlay', async ({ page }) => {
    await loginUser(page)
    await page.getByText('Yo').click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: 'playwright-review/dark-05-profile.png' })
  })

  test('dark: finances', async ({ page }) => {
    await loginUser(page)
    await page.getByText('Fondo', { exact: true }).click()
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'playwright-review/dark-06-finances.png', fullPage: true })
  })
})

test.describe('Visual — Desktop viewport', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('desktop: app layout (dashboard)', async ({ page }) => {
    await loginUser(page)
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'playwright-review/desktop-01-dashboard.png', fullPage: true })
  })

  test('desktop: finances', async ({ page }) => {
    await loginUser(page)
    await page.getByText('Fondo', { exact: true }).click()
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'playwright-review/desktop-02-finances.png', fullPage: true })
  })
})
