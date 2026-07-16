import { CORS, stripe, userClient } from '../_shared/stripe.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    if (req.method !== 'POST') throw new Error('Method not allowed')

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabase = userClient(authHeader)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { story_id, return_url } = await req.json() as { story_id?: string; return_url?: string }
    if (!story_id || !return_url) throw new Error('story_id y return_url son obligatorios')

    const { data: isAdmin, error: adminError } = await supabase
      .rpc('is_story_admin', { p_story_id: story_id })
    if (adminError) throw adminError
    if (!isAdmin) throw new Error('Solo un administrador puede gestionar la suscripción')

    const { data: ent } = await supabase
      .from('story_entitlements')
      .select('stripe_customer_id')
      .eq('story_id', story_id)
      .maybeSingle()
    if (!ent?.stripe_customer_id) throw new Error('Esta Historia no tiene una suscripción')

    const session = await stripe.billingPortal.sessions.create({
      customer: ent.stripe_customer_id,
      return_url,
    })

    return Response.json({ url: session.url }, { headers: CORS })
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 400, headers: CORS })
  }
})
