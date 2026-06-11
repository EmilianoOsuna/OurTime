import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore — web-push via npm specifier
import webpush from 'npm:web-push@3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:emilianingo2@gmail.com'
const FCM_SERVICE_ACCOUNT_JSON = Deno.env.get('FCM_SERVICE_ACCOUNT')

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

let _fcmToken: { access_token: string; expires_at: number } | null = null

async function getFCMAccessToken(): Promise<string> {
  if (_fcmToken && Date.now() < _fcmToken.expires_at) return _fcmToken.access_token
  if (!FCM_SERVICE_ACCOUNT_JSON) throw new Error('FCM_SERVICE_ACCOUNT not configured')

  const sa = JSON.parse(FCM_SERVICE_ACCOUNT_JSON)

  function base64url(s: string): string {
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  function base64urlBytes(bytes: Uint8Array): string {
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  }))

  const pem = sa.private_key
  const pemContents = pem.replace(/-----BEGIN [\w\s]+ KEY-----/, '').replace(/-----END [\w\s]+ KEY-----/, '').replace(/\s+/g, '')
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    new TextEncoder().encode(`${header}.${claims}`),
  )
  const sig = base64urlBytes(new Uint8Array(signature))

  const assertion = `${header}.${claims}.${sig}`

  const res = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })

  const data = await res.json()
  if (!data.access_token) throw new Error(`FCM token error: ${JSON.stringify(data)}`)

  _fcmToken = { access_token: data.access_token, expires_at: now + (data.expires_in ?? 3600) - 60 }
  return data.access_token
}

async function sendFCM(deviceToken: string, title: string, body: string, tag: string, url: string) {
  const accessToken = await getFCMAccessToken()
  const projectId = JSON.parse(FCM_SERVICE_ACCOUNT_JSON!).project_id
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

  const payload = {
    message: {
      token: deviceToken,
      notification: { title, body },
      android: { notification: { sound: 'default', tag, channelId: 'ourtime_messages' } },
      data: { url },
    },
  }

  const res = await fetch(fcmUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('FCM send error:', err)
  }
  return res
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { story_id, title, body, url } = await req.json()
    const sender_id = user.id

    const { count: recentCount, error: countErr } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('actor_id', sender_id)
      .gte('created_at', new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString())
    if (countErr) throw countErr
    if (recentCount !== null && recentCount >= RATE_LIMIT_MAX) {
      return new Response(JSON.stringify({ error: 'Demasiadas notificaciones. Esperá un momento.' }), {
        status: 429, headers: corsHeaders,
      })
    }

    const { data: members } = await supabase
      .from('story_members')
      .select('user_id')
      .eq('story_id', story_id)
      .neq('user_id', sender_id)

    if (!members?.length) return new Response('No recipients', { status: 200, headers: corsHeaders })

    const userIds = members.map(m => m.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, push_subscription')
      .in('id', userIds)
      .not('push_subscription', 'is', null)

    if (!profiles?.length) return new Response('No subscriptions', { status: 200, headers: corsHeaders })

    const results = await Promise.allSettled(
      profiles.map(p => {
        const sub = p.push_subscription
        if (sub.endpoint) {
          return webpush.sendNotification(sub, JSON.stringify({ title, body, tag: story_id, url: url ?? '/' }))
        }
        if (sub.platform === 'android' && sub.token) {
          return sendFCM(sub.token, title, body, story_id, url ?? '/')
        }
        return Promise.resolve()
      })
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    return new Response(JSON.stringify({ sent, total: profiles.length }), { status: 200, headers: corsHeaders })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: corsHeaders,
    })
  }
})