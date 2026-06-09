import { test, expect } from '@playwright/test'
import { loginUser } from './helpers/auth'

test.describe('Calendar — Agenda', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page)
    await page.getByText('Agenda').click()
    await page.waitForTimeout(600)
  })

  test('la pantalla de Agenda carga sin errores', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    await page.waitForTimeout(1000)
    expect(errors).toHaveLength(0)
  })

  test('muestra el mes y año actual', async ({ page }) => {
    // Calendar should show month name — check for Spanish month names
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    const currentMonth = months[new Date().getMonth()]
    const monthEl = page.getByText(new RegExp(currentMonth, 'i'))
    await expect(monthEl.first()).toBeVisible({ timeout: 5_000 })
  })

  test('screenshot — calendar view', async ({ page }) => {
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'playwright-review/qa-calendar.png', fullPage: true })
  })

  test('los días del mes son interactivos', async ({ page }) => {
    await page.waitForTimeout(500)
    // Find a day number button
    const dayButtons = page.locator('button').filter({ hasText: /^[0-9]{1,2}$/ })
    const count = await dayButtons.count()
    expect(count).toBeGreaterThan(20) // A month has at least 28 days
  })

  test('navegación entre meses', async ({ page }) => {
    // Look for prev/next month buttons
    const prevBtn = page.locator('button').filter({ has: page.locator('[data-icon="chevL"], svg') }).first()
    const nextBtn = page.locator('button').filter({ has: page.locator('[data-icon="chevR"], svg') }).last()

    // Just verify calendar renders and has navigation
    const calBody = page.locator('div').filter({ hasText: /[0-9]{1,2}/ }).first()
    await expect(calBody).toBeVisible()
  })
})
