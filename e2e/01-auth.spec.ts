import { test, expect } from '@playwright/test'
import { TEST_EMAIL, TEST_PASSWORD } from './helpers/auth'


test.describe('Auth — Pantalla de bienvenida', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('muestra el hero text y los tres botones de acción', async ({ page }) => {
    await expect(page.getByText('Su historia,')).toBeVisible()
    await expect(page.getByText('un momento')).toBeVisible()
    await expect(page.getByText('Planes, recuerdos y cuentas compartidas')).toBeVisible()
    await expect(page.getByRole('button', { name: /Crear cuenta/i })).toBeVisible()
    await expect(page.getByText('Ya tengo cuenta — Iniciar sesión')).toBeVisible()
    await expect(page.getByText('Continuar con Google')).toBeVisible()
  })

  test('el texto de bienvenida usa la tipografía display correcta', async ({ page }) => {
    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()
    const fontSize = await heading.evaluate(el => getComputedStyle(el).fontSize)
    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(36)
  })

  test('screenshot — welcome light', async ({ page }) => {
    await page.waitForTimeout(600) // wait for animation
    await page.screenshot({ path: 'playwright-review/qa-welcome-light.png', fullPage: false })
  })
})

test.describe('Auth — Flujo de registro', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /Crear cuenta/i }).first()).toBeVisible()
    await page.getByRole('button', { name: /Crear cuenta/i }).first().click()
    // Wait for register screen heading
    await expect(page.locator('h1').first()).toContainText('Crea tu', { timeout: 5_000 })
  })

  test('navega a la pantalla de registro', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Crea tu')
    // Eyebrow uses text-transform:uppercase in CSS — just verify it's visible
    await expect(page.locator('.eyebrow').first()).toBeVisible()
    // Use .first() because Onboarding also has a "Mateo" placeholder in the DOM
    await expect(page.getByPlaceholder('Mateo').first()).toBeVisible()
    await expect(page.getByPlaceholder('mateo@correo.com').first()).toBeVisible()
    await expect(page.getByPlaceholder('Mínimo 8 caracteres')).toBeVisible()
  })

  test('el avatar preview muestra "?" vacío y se actualiza al escribir', async ({ page }) => {
    const avatar = page.locator('div.avatar').first()
    await expect(avatar).toContainText('?')
    await page.getByPlaceholder('Mateo').first().fill('Juan')
    await page.waitForTimeout(200)
    await expect(avatar).toContainText('J')
  })

  test('el botón Continuar está deshabilitado con campos vacíos', async ({ page }) => {
    const btn = page.locator('form button[type="submit"]').first()
    await expect(btn).toBeDisabled()
  })

  test('el botón Continuar se activa con datos válidos', async ({ page }) => {
    await page.getByPlaceholder('Mateo').first().fill('Juan')
    await page.getByPlaceholder('mateo@correo.com').first().fill('juan@test.com')
    await page.getByPlaceholder('Mínimo 8 caracteres').fill('password123')
    const btn = page.locator('form button[type="submit"]').first()
    await expect(btn).toBeEnabled()
  })

  test('muestra error inline con contraseña corta (< 8 chars)', async ({ page }) => {
    await page.getByPlaceholder('Mateo').first().fill('Juan')
    await page.getByPlaceholder('mateo@correo.com').first().fill('juan@test.com')
    await page.getByPlaceholder('Mínimo 8 caracteres').fill('abc')
    await expect(page.locator('div').filter({ hasText: /Mínimo 8 caracteres/ }).last()).toBeVisible()
    await expect(page.locator('form button[type="submit"]').first()).toBeDisabled()
  })

  test('botón Volver regresa a la pantalla de bienvenida', async ({ page }) => {
    await page.getByRole('button', { name: /Volver/i }).click()
    await expect(page.getByRole('button', { name: /Crear cuenta/i }).first()).toBeVisible()
  })

  test('link "Inicia sesión" navega al login', async ({ page }) => {
    await page.getByText('Inicia sesión').click()
    await expect(page.getByText('Tu historia te está esperando.')).toBeVisible()
  })

  test('screenshot — register screen con nombre', async ({ page }) => {
    await page.getByPlaceholder('Mateo').first().fill('Ana')
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'playwright-review/qa-register.png', fullPage: false })
  })
})

test.describe('Auth — Flujo de login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const startButton = page.getByRole('button', { name: 'Empezar', exact: true })
    await expect(startButton).toBeVisible()
    await startButton.click()
    await expect(page.getByText('Ya tengo cuenta — Iniciar sesión')).toBeVisible()
    await page.getByText('Ya tengo cuenta — Iniciar sesión').click()
  })

  test('muestra la pantalla de login correctamente', async ({ page }) => {
    await expect(page.getByText('Iniciar')).toBeVisible()
    await expect(page.getByText('Tu historia te está esperando.')).toBeVisible()
    await expect(page.getByPlaceholder('mateo@correo.com')).toBeVisible()
    await expect(page.getByPlaceholder('Tu contraseña')).toBeVisible()
    await expect(page.getByText('¿Olvidaste tu contraseña?')).toBeVisible()
    await expect(page.getByText('Continuar con Google')).toBeVisible()
  })

  test('el botón Entrar está deshabilitado sin email', async ({ page }) => {
    const btn = page.getByRole('button', { name: /Entrar/i })
    await expect(btn).toBeDisabled()
  })

  test('el botón Entrar se activa con email y contraseña', async ({ page }) => {
    await page.getByPlaceholder('mateo@correo.com').fill('test@correo.com')
    await page.getByPlaceholder('Tu contraseña').fill('password')
    const btn = page.getByRole('button', { name: /Entrar/i })
    await expect(btn).toBeEnabled()
  })

  test('muestra error con credenciales incorrectas', async ({ page }) => {
    await page.getByPlaceholder('mateo@correo.com').fill('noexiste@correo.com')
    await page.getByPlaceholder('Tu contraseña').fill('wrongpass')
    await page.getByRole('button', { name: /Entrar/i }).click()
    await expect(page.locator('div').filter({ hasText: /Invalid|credencial|contraseña|correo/i }).first()).toBeVisible({ timeout: 10_000 })
  })

  test('link "¿Olvidaste tu contraseña?" navega al forgot', async ({ page }) => {
    await page.getByText('¿Olvidaste tu contraseña?').click()
    await expect(page.getByText('¿Olvidaste tu')).toBeVisible()
    await expect(page.getByText('Te enviamos un enlace para recuperarla.')).toBeVisible()
  })

  test('botón Volver regresa a la bienvenida', async ({ page }) => {
    await page.getByRole('button', { name: /Volver/i }).click()
    await expect(page.getByText('Crear cuenta')).toBeVisible()
  })

  test('screenshot — login screen', async ({ page }) => {
    await page.getByPlaceholder('mateo@correo.com').fill(TEST_EMAIL)
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'playwright-review/qa-login.png', fullPage: false })
  })

  test('login exitoso con credenciales válidas → entra al app', async ({ page }) => {
    await page.getByPlaceholder('mateo@correo.com').fill(TEST_EMAIL)
    await page.getByPlaceholder('Tu contraseña').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /Entrar/i }).click()
    // FAB is unique to the authenticated AppShell — no ambiguity
    await expect(page.locator('[data-testid="fab-btn"]')).toBeVisible({ timeout: 20_000 })
  })

  test('mantiene la sesión después de recargar la página', async ({ page }) => {
    await page.getByPlaceholder('mateo@correo.com').fill(TEST_EMAIL)
    await page.getByPlaceholder('Tu contraseña').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /Entrar/i }).click()
    await expect(page.locator('[data-testid="fab-btn"]')).toBeVisible({ timeout: 20_000 })

    await page.reload()

    await expect(page.locator('[data-testid="fab-btn"]')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Ya tengo cuenta — Iniciar sesión')).not.toBeVisible()
  })
})

test.describe('Auth — Recuperar contraseña', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByText('Ya tengo cuenta — Iniciar sesión').click()
    await page.getByText('¿Olvidaste tu contraseña?').click()
  })

  test('muestra la pantalla de recuperación', async ({ page }) => {
    await expect(page.getByText('Recuperar acceso')).toBeVisible()
    await expect(page.getByText('Te enviamos un enlace para recuperarla.')).toBeVisible()
  })

  test('botón Volver regresa al login', async ({ page }) => {
    await page.getByRole('button', { name: /Volver/i }).click()
    await expect(page.getByText('Tu historia te está esperando.')).toBeVisible()
  })
})
