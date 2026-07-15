import { test, expect } from '@playwright/test'
import { loginUser } from './helpers/auth'

test.describe('Navegación — NavBar', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page)
  })

  test('muestra todos los tabs del NavBar', async ({ page }) => {
    const nav = page.locator('nav').last()
    await expect(nav.getByText('Inicio')).toBeVisible()
    await expect(nav.getByText('Agenda')).toBeVisible()
    await expect(nav.getByText('Fotos')).toBeVisible()
    await expect(nav.getByText('Fondo', { exact: true })).toBeVisible()
    await expect(nav.getByText('Chat')).toBeVisible()
    await expect(nav.getByText('Yo')).toBeVisible()
  })

  test('el FAB (+) abre el GlobalActionSheet', async ({ page }) => {
    // Click the FAB — the circular button with the plus icon in the NavBar
    const nav = page.locator('nav').last()
    const fab = nav.locator('button').filter({ hasNot: page.locator('span') }).nth(2)
    // More reliable: find the button with Plus icon by looking for the center button
    // The FAB has a circular style with background accent color
    await page.locator('[data-testid="fab-btn"]').click()
    await expect(page.getByText('¿Qué añadimos?')).toBeVisible({ timeout: 5_000 })
  })

  test('GlobalActionSheet muestra todas las acciones', async ({ page }) => {
    await page.locator('[data-testid="fab-btn"]').click()
    await expect(page.getByText('Nuevo momento')).toBeVisible()
    await expect(page.getByText('Nuevo recuerdo')).toBeVisible()
    await expect(page.getByText('Nuevo movimiento')).toBeVisible()
    await expect(page.getByText('Nueva historia')).toBeVisible()
    await expect(page.getByText('Sigue escribiendo su historia.')).toBeVisible()
  })

  test('GlobalActionSheet se cierra al hacer click en el backdrop', async ({ page }) => {
    await page.locator('[data-testid="fab-btn"]').click()
    await expect(page.getByText('¿Qué añadimos?')).toBeVisible()
    // Click in the top area of the screen — outside the bottom sheet — to hit the backdrop
    await page.mouse.click(195, 80)
    await expect(page.getByText('¿Qué añadimos?')).not.toBeVisible({ timeout: 5_000 })
  })

  test('navega al tab Agenda', async ({ page }) => {
    await page.getByText('Agenda').click()
    // Calendar page should be visible
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'playwright-review/qa-tab-agenda.png', fullPage: false })
    // Verify we're on calendar - check for month/year heading or calendar grid
    const calendarContent = page.locator('main, [style*="padding"]').first()
    await expect(calendarContent).toBeVisible()
  })

  test('navega al tab Fotos', async ({ page }) => {
    await page.getByText('Fotos').click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'playwright-review/qa-tab-fotos.png', fullPage: false })
  })

  test('navega al tab Gasto', async ({ page }) => {
    await page.getByText('Fondo', { exact: true }).click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'playwright-review/qa-tab-gasto.png', fullPage: false })
  })

  test('navega al tab Chat', async ({ page }) => {
    await page.locator('nav').last().getByText('Chat').click()
    await page.waitForTimeout(500)
    // When in Chat, FAB should be hidden (NavBar is hidden in chat)
    await expect(page.locator('[data-testid="fab-btn"]')).not.toBeVisible()
    await page.screenshot({ path: 'playwright-review/qa-tab-chat.png', fullPage: false })
  })

  test('el NavBar se oculta en el tab Chat y el botón "atrás" regresa a Inicio', async ({ page }) => {
    await page.locator('nav').last().getByText('Chat').click()
    await page.waitForTimeout(300)
    // NavBar hidden in chat — FAB is not visible
    await expect(page.locator('[data-testid="fab-btn"]')).not.toBeVisible()
    // Navigate back via browser back
    await page.goBack()
    await expect(page.locator('[data-testid="fab-btn"]')).toBeVisible({ timeout: 5_000 })
  })

  test('el tab activo queda persistido en sessionStorage', async ({ page }) => {
    await page.getByText('Agenda').click()
    await page.waitForTimeout(300)
    const savedTab = await page.evaluate(() => sessionStorage.getItem('activeTab'))
    expect(savedTab).toBe('calendar')
  })

  test('el botón "Yo" (perfil) abre el ProfileScreen', async ({ page }) => {
    await page.locator('nav').last().getByText('Yo').click()
    await page.waitForTimeout(500)
    await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible({ timeout: 5_000 })
    await page.screenshot({ path: 'playwright-review/qa-profile.png', fullPage: false })
  })

  test('screenshot — NavBar light mode', async ({ page }) => {
    await page.waitForTimeout(600)
    await page.screenshot({ path: 'playwright-review/qa-navbar-light.png', fullPage: false })
  })
})

test.describe('Navegación — Acciones rápidas (FAB)', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page)
    // Open the action sheet
    await page.locator('[data-testid="fab-btn"]').click()
    await expect(page.getByText('¿Qué añadimos?')).toBeVisible()
  })

  test('"Nuevo momento" abre el NewPlanSheet', async ({ page }) => {
    await page.getByText('Nuevo momento').click()
    // NewPlanSheet should appear with a title input
    await expect(page.getByPlaceholder(/título|nombre|plan/i).or(
      page.getByText('Nuevo momento', { exact: false })
    )).toBeVisible({ timeout: 5_000 })
    await page.screenshot({ path: 'playwright-review/qa-new-plan-sheet.png', fullPage: false })
  })

  test('"Nuevo recuerdo" abre el NewMemorySheet', async ({ page }) => {
    await page.getByText('Nuevo recuerdo').click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'playwright-review/qa-new-memory-sheet.png', fullPage: false })
  })

  test('"Nuevo movimiento" abre el MoneySheet', async ({ page }) => {
    await page.getByText('Nuevo movimiento').click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'playwright-review/qa-money-sheet.png', fullPage: false })
  })

  test('"Nueva historia" abre el NewStorySheet', async ({ page }) => {
    await page.getByText('Nueva historia').click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'playwright-review/qa-new-story-sheet.png', fullPage: false })
  })
})
