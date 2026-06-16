import { supabase } from './supabase'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const GIS_SRC = 'https://accounts.google.com/gsi/client'
const GIS_SCRIPT_ID = 'google-identity-services'

type GoogleCredentialResponse = {
  credential?: string
  select_by?: string
}

type GoogleCodeResponse = {
  code?: string
  error?: string
  error_description?: string
}

type CodeClient = {
  requestCode: (overrideConfig?: Record<string, unknown>) => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: GoogleCredentialResponse) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }) => void
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
        }
        oauth2: {
          initCodeClient: (config: {
            client_id: string
            scope: string
            ux_mode: 'popup'
            callback: (response: GoogleCodeResponse) => void
            error_callback?: (error: unknown) => void
            include_granted_scopes?: boolean
          }) => CodeClient
        }
      }
    }
  }
}

export function hasGoogleClientId(): boolean {
  return Boolean(GOOGLE_CLIENT_ID)
}

function getGoogleClientId(): string {
  if (!GOOGLE_CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID no está configurado.')
  return GOOGLE_CLIENT_ID
}

export function loadGoogleIdentityServices(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(GIS_SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google Identity Services.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = GIS_SCRIPT_ID
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services.'))
    document.head.appendChild(script)
  })
}

export async function renderGoogleSignInButton(
  parent: HTMLElement,
  onSuccess: () => void,
  onError: (message: string) => void,
): Promise<void> {
  const clientId = getGoogleClientId()
  await loadGoogleIdentityServices()

  const google = window.google
  if (!google?.accounts) throw new Error('Google Identity Services no está disponible.')

  parent.innerHTML = ''
  google.accounts.id.initialize({
    client_id: clientId,
    auto_select: false,
    cancel_on_tap_outside: true,
    callback: async (response) => {
      if (!response.credential) {
        onError('Google no devolvió una credencial válida.')
        return
      }
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      })
      if (error) onError(error.message)
      else onSuccess()
    },
  })

  google.accounts.id.renderButton(parent, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'pill',
    logo_alignment: 'left',
    width: Math.min(parent.clientWidth || 320, 400),
  })
}

export async function requestGoogleCalendarCode(scope: string): Promise<{ code: string; redirectUri: string }> {
  const clientId = getGoogleClientId()
  await loadGoogleIdentityServices()

  const google = window.google
  if (!google?.accounts) throw new Error('Google Identity Services no está disponible.')

  return new Promise((resolve, reject) => {
    const redirectUri = window.location.origin
    const client = google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope,
      ux_mode: 'popup',
      include_granted_scopes: true,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error))
          return
        }
        if (!response.code) {
          reject(new Error('Google no devolvió un código de autorización.'))
          return
        }
        resolve({ code: response.code, redirectUri })
      },
      error_callback: (error) => {
        reject(new Error(error instanceof Error ? error.message : 'No se pudo abrir Google.'))
      },
    })

    client.requestCode({ prompt: 'consent' })
  })
}
