import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { plan_id } = await req.json() as { plan_id: string }

    const { data: plan, error: planErr } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single()

    if (planErr || !plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404, headers: CORS })
    }

    // Read google_calendar_token from DB instead of client body
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_calendar_token')
      .eq('id', user.id)
      .single()
    const provider_token = profile?.google_calendar_token
    if (!provider_token) {
      return new Response(JSON.stringify({ error: 'Google Calendar not connected' }), { status: 400, headers: CORS })
    }

    // Build Google Calendar event
    const startDate = plan.plan_date.slice(0, 10)
    const event = {
      summary: plan.title,
      location: plan.place ?? undefined,
      description: plan.description ?? undefined,
      start: { date: startDate },
      end: { date: startDate },
    }

    const gcalRes = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${provider_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    )

    if (!gcalRes.ok) {
      const errBody = await gcalRes.text()
      return new Response(JSON.stringify({ error: 'Google Calendar error', detail: errBody }), {
        status: gcalRes.status, headers: CORS,
      })
    }

    const gcalEvent = await gcalRes.json()
    return new Response(JSON.stringify({ google_event_id: gcalEvent.id }), { headers: CORS })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS })
  }
})
