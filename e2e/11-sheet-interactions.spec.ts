import { test, expect } from '@playwright/test'
import { loginUser } from './helpers/auth'

test.beforeEach(async ({ page }) => {
  await loginUser(page)
  await page.locator('[data-testid="fab-btn"]').click()
  await expect(page.locator('[data-testid="bottom-sheet-panel"]')).toBeVisible()
})

test('mover el mouse sobre el modal no lo cierra', async ({ page }) => {
  const panel = page.locator('[data-testid="bottom-sheet-panel"]')
  const box = await panel.boundingBox()
  expect(box).not.toBeNull()

  await page.mouse.move(box!.x + 20, box!.y + 20)
  await page.mouse.move(box!.x + box!.width - 20, box!.y + box!.height - 20)

  await expect(panel).toBeVisible()
})

test('cerrar con drag no bloquea el siguiente clic', async ({ page }) => {
  const handle = page.locator('[data-testid="bottom-sheet-handle"]')
  const box = await handle.boundingBox()
  expect(box).not.toBeNull()
  const x = box!.x + box!.width / 2
  const startY = box!.y + box!.height / 2

  await page.mouse.move(x, startY)
  await page.mouse.down()
  await page.mouse.move(x, startY + 180, { steps: 8 })
  await page.mouse.up()

  await page.getByRole('button', { name: 'Agenda' }).click()
  await expect(page.locator('[data-testid="bottom-sheet-root"]')).not.toBeVisible()
  await expect(page.getByText('Agenda', { exact: true }).first()).toBeVisible()
})

test('un drag parcial no consume el primer toque en un botón del modal', async ({ page }) => {
  const handle = page.locator('[data-testid="bottom-sheet-handle"]')
  const box = await handle.boundingBox()
  expect(box).not.toBeNull()
  const x = box!.x + box!.width / 2
  const startY = box!.y + box!.height / 2

  await page.mouse.move(x, startY)
  await page.mouse.down()
  await page.mouse.move(x, startY + 60, { steps: 5 })
  await page.mouse.up()

  await page.getByRole('button', { name: /Nuevo momento/ }).tap()
  await expect(page.getByPlaceholder('Cena sorpresa en…')).toBeVisible()
})
