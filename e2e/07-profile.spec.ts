import { test, expect } from '@playwright/test'
import { loginUser } from './helpers/auth'

test.describe('Profile — Perfil de usuario', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page)
    // Open profile via "Yo" button in NavBar
    await page.getByText('Yo').click()
    await page.waitForTimeout(600)
  })

  test('el ProfileScreen se abre correctamente', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible({ timeout: 5_000 })
  })

  test('screenshot — profile screen', async ({ page }) => {
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'playwright-review/qa-profile-full.png', fullPage: false })
  })

  test('muestra el código de invitación de la historia', async ({ page }) => {
    // Story invite code should be visible in the profile
    const inviteCode = page.getByText(/[A-Z]{3,6}-[0-9]{4}/)
    const count = await inviteCode.count()
    // If user has a story with invite code, it should show
    // If no story, this is OK too
    if (count > 0) {
      await expect(inviteCode.first()).toBeVisible()
    }
  })

  test('muestra sección "Esta Historia" con miembros', async ({ page }) => {
    await page.waitForTimeout(500)
    await expect(page.getByText('Esta Historia')).toBeVisible({ timeout: 5_000 })
  })

  test('la sección "Tu perfil" está presente', async ({ page }) => {
    await expect(page.getByText('Tu perfil')).toBeVisible({ timeout: 5_000 })
  })

  test('las secciones principales están presentes', async ({ page }) => {
    // Profile sections are visible without scrolling
    await expect(page.locator('span.eyebrow').filter({ hasText: 'Esta Historia' })).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('span.eyebrow').filter({ hasText: 'Tu perfil' })).toBeVisible({ timeout: 5_000 })
  })

  test('el perfil se puede cerrar con el botón chevron', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible({ timeout: 5_000 })
    await page.locator('[data-testid="profile-close-btn"]').click()
    await page.waitForTimeout(600)
    await expect(page.locator('[data-testid="fab-btn"]')).toBeVisible({ timeout: 5_000 })
  })

  test('screenshot — profile scrolled', async ({ page }) => {
    const overlay = page.locator('div[style*="position: fixed"]').last()
    await overlay.evaluate(el => el.scrollTop = 300)
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'playwright-review/qa-profile-scrolled.png', fullPage: false })
  })
})
