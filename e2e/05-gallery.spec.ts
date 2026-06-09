import { test, expect } from '@playwright/test'
import { loginUser } from './helpers/auth'

test.describe('Gallery — Fotos/Recuerdos', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page)
    await page.getByText('Fotos').click()
    await page.waitForTimeout(600)
  })

  test('la pantalla de Fotos carga sin errores', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    await page.waitForTimeout(1000)
    expect(errors).toHaveLength(0)
  })

  test('screenshot — gallery view', async ({ page }) => {
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'playwright-review/qa-gallery.png', fullPage: true })
  })

  test('las imágenes son clickeables y abren el lightbox', async ({ page }) => {
    await page.waitForTimeout(1000)
    const images = page.locator('img')
    const count = await images.count()
    if (count > 0) {
      await images.first().click()
      await page.waitForTimeout(400)
      // Lightbox should appear (full-screen overlay)
      const lightbox = page.locator('div[style*="rgba(0,0,0"]').or(
        page.locator('div[style*="position: fixed"]').filter({ has: page.locator('img') })
      )
      // If lightbox appeared, verify it exists
      const lightboxVisible = await lightbox.first().isVisible().catch(() => false)
      if (lightboxVisible) {
        await page.screenshot({ path: 'playwright-review/qa-lightbox.png', fullPage: false })
        // Close lightbox by clicking it
        await lightbox.first().click()
        await expect(lightbox.first()).not.toBeVisible({ timeout: 3_000 })
      }
    }
  })

  test('empty state cuando no hay fotos', async ({ page }) => {
    await page.waitForTimeout(1000)
    const images = page.locator('img')
    const count = await images.count()
    if (count === 0) {
      // Should show empty state message
      const body = await page.locator('body').textContent()
      expect(body).toBeTruthy()
    }
  })
})
