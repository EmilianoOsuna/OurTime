import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')

async function refreshGoogleToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number }> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) throw new Error('Google OAuth refresh is not configured')
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await response.json()
  if (!response.ok || !data.access_token) throw new Error(`Google token refresh failed: ${JSON.stringify(data)}`)
  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in ?? 3600) - 60) * 1000,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { plan_id, test_connection } = await req.json() as { plan_id?: string; test_connection?: boolean }

    // Read google_calendar_token from user_secrets (or legacy profiles column)
    const { data: secrets } = await supabase
      .from('user_secrets')
      .select('name, value')
      .eq('user_id', user.id)
      .in('name', ['google_calendar_token', 'google_calendar_refresh_token', 'google_calendar_token_expires_at'])
    const secretMap = new Map((secrets ?? []).map(secret => [secret.name, secret.value]))
    let provider_token = secretMap.get('google_calendar_token') ?? null
    const refreshToken = secretMap.get('google_calendar_refresh_token') ?? null
    const expiresAt = Number(secretMap.get('google_calendar_token_expires_at') ?? 0)
    if (!provider_token) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('google_calendar_token')
        .eq('id', user.id)
        .single()
      provider_token = profile?.google_calendar_token ?? null
    }
    if (!provider_token) {
      return Response.json({ error: 'Google Calendar not connected', detail: 'Desconecta y vuelve a conectar Google Calendar desde tu perfil.' }, { headers: CORS })
    }

    if (refreshToken && expiresAt <= Date.now()) {
      const refreshed = await refreshGoogleToken(refreshToken)
      provider_token = refreshed.accessToken
      await supabase.from('user_secrets').upsert([
        { user_id: user.id, name: 'google_calendar_token', value: refreshed.accessToken },
        { user_id: user.id, name: 'google_calendar_token_expires_at', value: String(refreshed.expiresAt) },
      ], { onConflict: 'user_id,name' })
    }

    if (test_connection === true) {
      const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(provider_token)}`)
      const tokenInfo = await tokenInfoResponse.json()
      const scopes = String(tokenInfo.scope ?? '').split(' ')
      const hasCalendarScope = scopes.includes('https://www.googleapis.com/auth/calendar')
        || scopes.includes('https://www.googleapis.com/auth/calendar.events')
      if (!tokenInfoResponse.ok || !hasCalendarScope) {
        return Response.json({
          error: 'Google Calendar permission missing',
          detail: 'La autorización actual no incluye Google Calendar. Desconecta y vuelve a conectar para conceder el permiso.',
        }, { headers: CORS })
      }

      const testResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=1&singleEvents=true', {
        headers: { Authorization: `Bearer ${provider_token}` },
      })
      if (!testResponse.ok) {
        const detail = await testResponse.text()
        return Response.json({ error: 'Google Calendar connection failed', detail, google_status: testResponse.status }, { headers: CORS })
      }
      return Response.json({ connected: true })
    }

    if (!plan_id) return Response.json({ error: 'Missing plan_id' }, { headers: CORS })
    const { data: plan, error: planErr } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single()

    if (planErr || !plan) {
      return Response.json({ error: 'Plan not found', detail: planErr?.message }, { headers: CORS })
    }

    // Build Google Calendar event
    const startDate = plan.plan_date.slice(0, 10)
    const end = new Date(`${startDate}T00:00:00Z`)
    end.setUTCDate(end.getUTCDate() + 1)
    const endDate = end.toISOString().slice(0, 10)
    const event = {
      summary: plan.title,
      location: plan.place ?? undefined,
      description: plan.description ?? undefined,
      start: { date: startDate },
      end: { date: endDate },
    }

    const sendEvent = (token: string) => fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      })
    let gcalRes = await sendEvent(provider_token)
    if (gcalRes.status === 401 && refreshToken) {
      const refreshed = await refreshGoogleToken(refreshToken)
      provider_token = refreshed.accessToken
      await supabase.from('user_secrets').upsert([
        { user_id: user.id, name: 'google_calendar_token', value: refreshed.accessToken },
        { user_id: user.id, name: 'google_calendar_token_expires_at', value: String(refreshed.expiresAt) },
      ], { onConflict: 'user_id,name' })
      gcalRes = await sendEvent(provider_token)
    }

    if (!gcalRes.ok) {
      const errBody = await gcalRes.text()
      return Response.json({ error: 'Google Calendar error', detail: errBody, google_status: gcalRes.status }, { headers: CORS })
    }

    const gcalEvent = await gcalRes.json()
    return new Response(JSON.stringify({ google_event_id: gcalEvent.id }), { headers: CORS })
  } catch (e) {
    return Response.json({
      error: 'Google Calendar setup error',
      detail: e instanceof Error ? e.message : String(e),
    }, { headers: CORS })
  }
})
