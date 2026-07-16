import Stripe from 'npm:stripe@16'
import { CORS, stripe, serviceClient, planForPrice, mapStatus } from '../_shared/stripe.ts'

// El webhook NO valida JWT (lo llama Stripe, no un usuario). Desplegar con
// `supabase functions deploy stripe-webhook --no-verify-jwt`.
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
const cryptoProvider = Stripe.createSubtleCryptoProvider()

/** Escribe/actualiza la entitlement de la Historia a partir de una suscripción. */
async function upsertFromSubscription(sub: Stripe.Subscription) {
  const supabase = serviceClient()
  const storyId = sub.metadata?.story_id
  const priceId = sub.items.data[0]?.price?.id
  const plan = mapStatus(sub.status) === 'canceled' ? 'free' : planForPrice(priceId)

  const row = {
    plan,
    status: mapStatus(sub.status),
    payer_user_id: sub.metadata?.payer_user_id ?? null,
    stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    stripe_subscription_id: sub.id,
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }

  if (storyId) {
    await supabase.from('story_entitlements')
      .upsert({ story_id: storyId, ...row }, { onConflict: 'story_id' })
  } else {
    // Sin story_id en metadata (raro): localiza por subscription id.
    await supabase.from('story_entitlements')
      .update(row).eq('stripe_subscription_id', sub.id)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const signature = req.headers.get('stripe-signature')
  if (!signature) return new Response('Missing signature', { status: 400 })

  const body = await req.text() // raw body — obligatorio para verificar la firma
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body, signature, WEBHOOK_SECRET, undefined, cryptoProvider,
    )
  } catch (err) {
    return new Response(`Webhook signature failed: ${err instanceof Error ? err.message : err}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          // Propaga la metadata del checkout a la suscripción por si faltara.
          sub.metadata = { ...session.metadata, ...sub.metadata }
          await upsertFromSubscription(sub)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await upsertFromSubscription(event.data.object as Stripe.Subscription)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          const supabase = serviceClient()
          await supabase.from('story_entitlements')
            .update({ status: 'past_due', updated_at: new Date().toISOString() })
            .eq('stripe_subscription_id', invoice.subscription as string)
        }
        break
      }
      default:
        break
    }
    return Response.json({ received: true }, { headers: CORS })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return Response.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500, headers: CORS })
  }
})
