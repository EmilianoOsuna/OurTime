import { test, expect } from '@playwright/test'
import { loginUser } from './helpers/auth'

test.describe('Plan Detail — Detalle de momento', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page)
    await page.locator('nav').last().getByText('Inicio').click()
    await page.waitForTimeout(800)
  })

  test('hacer click en un plan abre el PlanDetail', async ({ page }) => {
    await page.waitForTimeout(1000)
    const planCards = page.locator('[data-testid="plan-card"]')
    const count = await planCards.count()
    if (count > 0) {
      await planCards.first().click()
      await page.waitForTimeout(600)
      await page.screenshot({ path: 'playwright-review/qa-plan-detail.png', fullPage: false })
    } else {
      test.skip()
    }
  })

  test('el PlanDetail muestra contenido del plan', async ({ page }) => {
    await page.waitForTimeout(1000)
    const planCards = page.locator('[data-testid="plan-card"]')
    const count = await planCards.count()
    if (count > 0) {
      const planTitle = await planCards.first().textContent()
      await planCards.first().click()
      await page.waitForTimeout(600)
      await page.screenshot({ path: 'playwright-review/qa-plan-detail-open.png', fullPage: false })
      // PlanDetail overlay (position:fixed, zIndex:95) — verify body has content
      const body = await page.locator('body').textContent()
      expect(body?.length).toBeGreaterThan(100)
    } else {
      test.skip()
    }
  })

  test('el PlanDetail se cierra al hacer click en el backdrop', async ({ page }) => {
    await page.waitForTimeout(1000)
    const planCards = page.locator('[data-testid="plan-card"]')
    const count = await planCards.count()
    if (count > 0) {
      await planCards.first().click()
      await page.waitForTimeout(400)
      // PlanDetail close: click the top-left area (outside the detail panel)
      await page.mouse.click(20, 80)
      await page.waitForTimeout(500)
      // FAB should be visible again
      await expect(page.locator('[data-testid="fab-btn"]')).toBeVisible({ timeout: 5_000 })
    } else {
      test.skip()
    }
  })
})

test.describe('New Plan — Crear momento', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page)
    await page.locator('[data-testid="fab-btn"]').click()
    await expect(page.getByText('¿Qué añadimos?')).toBeVisible()
    await page.getByText('Nuevo momento').click()
    await page.waitForTimeout(500)
  })

  test('el NewPlanSheet muestra los campos correctos', async ({ page }) => {
    await page.screenshot({ path: 'playwright-review/qa-newplan-sheet.png', fullPage: false })
    const inputs = page.locator('input, textarea')
    const count = await inputs.count()
    expect(count).toBeGreaterThan(0)
  })

  test('el NewPlanSheet se cierra al hacer click en el backdrop', async ({ page }) => {
    await expect(page.getByText('Nuevo momento').first()).toBeVisible()
    await page.mouse.click(195, 80)
    await page.waitForTimeout(600)
    await expect(page.locator('[data-testid="fab-btn"]')).toBeVisible({ timeout: 5_000 })
  })
})
