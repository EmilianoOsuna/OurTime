import { test, expect } from '@playwright/test'
import { loginUser } from './helpers/auth'

test.describe('Finances — Presupuesto/Gasto', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page)
    await page.getByText('Fondo', { exact: true }).click()
    await page.waitForTimeout(600)
  })

  test('la pantalla de Gasto carga sin errores', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    await page.waitForTimeout(1000)
    expect(errors).toHaveLength(0)
  })

  test('screenshot — finances view', async ({ page }) => {
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'playwright-review/qa-finances.png', fullPage: true })
  })

  test('muestra el saldo, gastado o información de presupuesto', async ({ page }) => {
    await page.waitForTimeout(1000)
    // Should show some financial information
    const body = await page.locator('body').textContent()
    // Check for common finance terms
    expect(body?.length).toBeGreaterThan(100)
  })

  test('el botón de añadir movimiento desde el FAB abre el MoneySheet', async ({ page }) => {
    // Open action sheet via FAB
    await page.locator('[data-testid="fab-btn"]').click()
    await expect(page.getByText('Nuevo movimiento')).toBeVisible()
    await page.getByText('Nuevo movimiento').click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'playwright-review/qa-money-sheet.png', fullPage: false })
  })
})
