import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
}

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')

type GoogleTokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  error?: string
  error_description?: string
}

function requireGoogleConfig() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth no está configurado en Supabase.')
  }
}

function assertValidRedirectUri(redirectUri: string, origin: string | null) {
  const parsed = new URL(redirectUri)
  if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('redirect_uri inválido.')
  }
  if (origin && parsed.origin !== origin) {
    throw new Error('redirect_uri no coincide con el origen de la solicitud.')
  }
  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
    throw new Error('redirect_uri debe usar HTTPS.')
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    requireGoogleConfig()
    if (req.method !== 'POST') throw new Error('Method not allowed')
    if (req.headers.get('X-Requested-With') !== 'XmlHttpRequest') {
      throw new Error('Invalid Google Calendar authorization request.')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { code, redirect_uri } = await req.json() as { code?: string; redirect_uri?: string }
    if (!code || !redirect_uri) throw new Error('Missing Google authorization code.')

    assertValidRedirectUri(redirect_uri, req.headers.get('Origin'))

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    })
    const tokenData = await response.json() as GoogleTokenResponse
    if (!response.ok || !tokenData.access_token) {
      const detail = tokenData.error_description || tokenData.error || JSON.stringify(tokenData)
      throw new Error(`Google token exchange failed: ${detail}`)
    }

    const scopes = String(tokenData.scope ?? '').split(' ')
    if (!scopes.includes('https://www.googleapis.com/auth/calendar.events')) {
      throw new Error('Google no concedió permiso para Calendar.')
    }

    const expiresAt = Date.now() + (Number(tokenData.expires_in ?? 3600) - 60) * 1000
    const secrets = [
      { user_id: user.id, name: 'google_calendar_token', value: tokenData.access_token },
      { user_id: user.id, name: 'google_calendar_token_expires_at', value: String(expiresAt) },
    ]
    if (tokenData.refresh_token) {
      secrets.push({ user_id: user.id, name: 'google_calendar_refresh_token', value: tokenData.refresh_token })
    }

    const { error: secretsError } = await supabase
      .from('user_secrets')
      .upsert(secrets, { onConflict: 'user_id,name' })
    if (secretsError) throw secretsError

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ google_calendar_enabled: true })
      .eq('id', user.id)
    if (profileError) throw profileError

    return Response.json({ connected: true }, { headers: CORS })
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 400, headers: CORS })
  }
})
