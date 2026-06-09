import { chromium } from '@playwright/test'
import { TEST_EMAIL, TEST_PASSWORD } from './helpers/auth'

const BASE_URL = 'http://localhost:5173'

export default async function globalSetup() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  })
  const page = await context.newPage()

  await page.goto(BASE_URL)

  // Wait for the page to load (either auth screen or app shell)
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page.waitForTimeout(2000)

  // Check if we're already logged in
  const fabVisible = await page.locator('[data-testid="fab-btn"]').isVisible().catch(() => false)
  if (!fabVisible) {
    // Need to log in — navigate to login flow
    const createBtnVisible = await page.getByText('Crear cuenta').isVisible().catch(() => false)
    if (createBtnVisible) {
      await page.getByText('Ya tengo cuenta — Iniciar sesión').click()
    }
    await page.waitForSelector('input[placeholder="mateo@correo.com"]', { timeout: 10_000 })
    await page.getByPlaceholder('mateo@correo.com').fill(TEST_EMAIL)
    await page.getByPlaceholder('Tu contraseña').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /Entrar/i }).click()
    await page.locator('[data-testid="fab-btn"]').waitFor({ state: 'visible', timeout: 25_000 })
  }

  await context.storageState({ path: 'e2e/.auth/user.json' })
  await browser.close()
  console.log('✓ Auth state saved — tests will reuse this session')
}
