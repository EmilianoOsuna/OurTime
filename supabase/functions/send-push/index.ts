import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore — web-push via npm specifier
import webpush from 'npm:web-push@3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:emilianingo2@gmail.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { story_id, sender_id, title, body } = await req.json()

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Get all members of the story except the sender
    const { data: members } = await supabase
      .from('story_members')
      .select('user_id')
      .eq('story_id', story_id)
      .neq('user_id', sender_id)

    if (!members?.length) return new Response('No recipients', { status: 200, headers: corsHeaders })

    // Get their push subscriptions
    const userIds = members.map(m => m.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, push_subscription')
      .in('id', userIds)
      .not('push_subscription', 'is', null)

    if (!profiles?.length) return new Response('No subscriptions', { status: 200, headers: corsHeaders })

    // Send push to each subscriber
    const results = await Promise.allSettled(
      profiles.map(p =>
        webpush.sendNotification(p.push_subscription, JSON.stringify({ title, body, tag: story_id }))
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    return new Response(JSON.stringify({ sent }), { status: 200, headers: corsHeaders })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: corsHeaders,
    })
  }
})
