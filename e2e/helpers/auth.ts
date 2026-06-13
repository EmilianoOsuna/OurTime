import { type Page, expect } from '@playwright/test'

export const TEST_EMAIL = 'emilianingo2@gmail.com'
export const TEST_PASSWORD = '7575'

export async function loginUser(page: Page) {
  await page.goto('/')

  // If FAB is already visible, we're already authenticated
  const fabVisible = await page.locator('[data-testid="fab-btn"]').isVisible({ timeout: 3_000 }).catch(() => false)
  if (fabVisible) return

  // Wait for auth screen
  await expect(page.getByText('Crear cuenta')).toBeVisible({ timeout: 10_000 })
  await page.getByText('Ya tengo cuenta — Iniciar sesión').click()
  await expect(page.getByPlaceholder('mateo@correo.com')).toBeVisible()
  await page.getByPlaceholder('mateo@correo.com').fill(TEST_EMAIL)
  await page.getByPlaceholder('Tu contraseña').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /Entrar/i }).click()
  await expect(page.locator('[data-testid="fab-btn"]')).toBeVisible({ timeout: 20_000 })
}
