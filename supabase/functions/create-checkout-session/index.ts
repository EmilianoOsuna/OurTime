import { CORS, stripe, userClient, priceIdFor, type PlanTier, type Interval } from '../_shared/stripe.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    if (req.method !== 'POST') throw new Error('Method not allowed')

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabase = userClient(authHeader)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const body = await req.json() as {
      story_id?: string
      plan?: PlanTier
      interval?: Interval
      success_url?: string
      cancel_url?: string
    }
    const { story_id, plan, interval = 'month', success_url, cancel_url } = body
    if (!story_id || !plan || (plan !== 'duo' && plan !== 'familia')) {
      throw new Error('story_id y plan (duo|familia) son obligatorios')
    }
    if (!success_url || !cancel_url) throw new Error('Faltan success_url / cancel_url')

    // Solo un admin de la Historia puede iniciar el pago del espacio compartido.
    const { data: isAdmin, error: adminError } = await supabase
      .rpc('is_story_admin', { p_story_id: story_id })
    if (adminError) throw adminError
    if (!isAdmin) throw new Error('Solo un administrador de la Historia puede suscribirse')

    // Reutiliza el customer si ya existía para esta Historia.
    const { data: existing } = await supabase
      .from('story_entitlements')
      .select('stripe_customer_id')
      .eq('story_id', story_id)
      .maybeSingle()

    let customerId = existing?.stripe_customer_id ?? undefined
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { story_id, user_id: user.id },
      })
      customerId = customer.id
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceIdFor(plan, interval), quantity: 1 }],
      success_url,
      cancel_url,
      client_reference_id: story_id,
      subscription_data: { metadata: { story_id, plan, payer_user_id: user.id } },
      metadata: { story_id, plan, payer_user_id: user.id },
      allow_promotion_codes: true,
      // `automatic_tax` exige que el customer tenga una dirección válida. Como el
      // customer se crea sin dirección, dejamos que Checkout la pida y la guarde
      // en el customer (si no, Stripe rechaza la sesión con "customer needs a
      // valid address"). Ver create-portal-session para actualizarla luego.
      billing_address_collection: 'required',
      customer_update: { address: 'auto' },
      automatic_tax: { enabled: true },
    })

    return Response.json({ url: session.url }, { headers: CORS })
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 400, headers: CORS })
  }
})
