import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ── Configuración del LLM ──────────────────────────────────────────────
// Configura UNA de estas keys como secret y la función usa ese proveedor:
//   GEMINI_API_KEY (o GOOGLE_API_KEY) → Google Gemini
//   ANTHROPIC_API_KEY                 → Anthropic Claude
//   OPENAI_API_KEY                    → OpenAI
// Overrides opcionales:
//   LLM_PROVIDER = 'google' | 'anthropic' | 'openai'  (si hay varias keys)
//   LLM_MODEL    = id de modelo del proveedor elegido
const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') ?? Deno.env.get('GOOGLE_API_KEY')
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY')

type Provider = 'google' | 'anthropic' | 'openai'

const DEFAULT_MODEL: Record<Provider, string> = {
  google: 'gemini-1.5-flash',
  anthropic: 'claude-3-5-sonnet-20240620',
  openai: 'gpt-4o-mini',
}

function resolveProvider(): Provider | null {
  const forced = (Deno.env.get('LLM_PROVIDER') ?? '').toLowerCase()
  if (forced === 'google' || forced === 'anthropic' || forced === 'openai') return forced
  if (GEMINI_KEY) return 'google'
  if (ANTHROPIC_KEY) return 'anthropic'
  if (OPENAI_KEY) return 'openai'
  return null
}

const MAX_INPUT_CHARS = 2000
const HISTORY_LIMIT = 20
const MAX_OUTPUT_TOKENS = 1024

type ChatTurn = { role: 'user' | 'assistant'; content: string }

// ── Adaptadores por proveedor ──────────────────────────────────────────

async function callGemini(model: string, system: string, turns: ChatTurn[]): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY! },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: turns.map(t => ({
          role: t.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: t.content }],
        })),
        generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
      }),
    },
  )
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  const parts: { text?: string }[] = data?.candidates?.[0]?.content?.parts ?? []
  return parts.map(p => p.text ?? '').join('').trim()
}

async function callAnthropic(model: string, system: string, turns: ChatTurn[]): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system,
      messages: turns,
    }),
  })
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  return data?.content
    ?.filter((block: { type: string; text: string }) => block.type === 'text')
    ?.map((block: { type: string; text: string }) => block.text)
    ?.join('\n')
    ?.trim() ?? ''
}

async function callOpenAI(model: string, system: string, turns: ChatTurn[]): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY!}` },
    body: JSON.stringify({
      model,
      max_completion_tokens: MAX_OUTPUT_TOKENS,
      messages: [{ role: 'system', content: system }, ...turns],
    }),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  return (data?.choices?.[0]?.message?.content ?? '').trim()
}

const CALLERS: Record<Provider, (model: string, system: string, turns: ChatTurn[]) => Promise<string>> = {
  google: callGemini,
  anthropic: callAnthropic,
  openai: callOpenAI,
}

// ── HTTP ───────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const CATEGORY_LABEL: Record<string, string> = {
  pareja: 'una pareja',
  amigos: 'un grupo de amigos',
  familia: 'una familia',
  otro: 'un grupo de personas cercanas',
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const provider = resolveProvider()
    if (!provider) {
      return json({ error: 'Sin proveedor de IA: configura GEMINI_API_KEY, ANTHROPIC_API_KEY u OPENAI_API_KEY como secret' }, 500)
    }
    const model = Deno.env.get('LLM_MODEL') || DEFAULT_MODEL[provider]

    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData?.user) return json({ error: 'No autorizado' }, 401)
    const user = userData.user

    const { text, story_id } = await req.json()
    if (typeof text !== 'string' || !text.trim() || typeof story_id !== 'string') {
      return json({ error: 'Faltan datos: text y story_id son obligatorios' }, 400)
    }
    const trimmed = text.trim().slice(0, MAX_INPUT_CHARS)

    const { data: membership } = await admin.from('story_members')
      .select('user_id').eq('story_id', story_id).eq('user_id', user.id).maybeSingle()
    if (!membership) return json({ error: 'No eres miembro de esta historia' }, 403)

    // ── RATE LIMITING ─────────────────────────────────────────────────────────
    // Validar cuántos mensajes ha enviado el usuario en la última hora para evitar
    // abusos y sobrecostos de la API (ej. límite de 30 mensajes por hora por usuario)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: userMessageCount, error: countError } = await admin.from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .gte('created_at', oneHourAgo)
    
    if (countError) throw countError
    if (userMessageCount !== null && userMessageCount > 30) {
      return json({ error: 'Has alcanzado el límite de sugerencias por hora. Por favor, intenta más tarde.' }, 429)
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Contexto: historia, miembros, próximos planes y conversación reciente
    const today = new Date().toISOString().slice(0, 10)
    const [storyRes, membersRes, plansRes, historyRes] = await Promise.all([
      admin.from('stories').select('name, category').eq('id', story_id).single(),
      admin.from('story_members').select('profiles(full_name)').eq('story_id', story_id),
      admin.from('plans').select('title, date, place, budget_amount')
        .eq('story_id', story_id).is('parent_plan_id', null)
        .gte('date', today).order('date', { ascending: true }).limit(5),
      admin.from('messages').select('text, role')
        .eq('story_id', story_id).order('created_at', { ascending: false }).limit(HISTORY_LIMIT),
    ])

    const story = storyRes.data
    const memberNames = (membersRes.data ?? [])
      .map((m: { profiles?: { full_name?: string } }) => m.profiles?.full_name)
      .filter(Boolean)
    const upcomingPlans = (plansRes.data ?? [])
      .map(p => `- ${p.title}${p.date ? ` (${p.date})` : ''}${p.place ? ` en ${p.place}` : ''}`)
      .join('\n')

    // Guardar el mensaje del usuario antes de llamar al modelo
    const { data: userMessage, error: insertError } = await admin.from('messages')
      .insert({ story_id, sender_id: user.id, text: trimmed, role: 'user' })
      .select().single()
    if (insertError) throw insertError

    const system = [
      'Eres el asistente de OurTime, una app para compartir planes, recuerdos y finanzas con las personas que quieres.',
      `Hablas con los miembros de la historia "${story?.name ?? 'sin nombre'}", que es ${CATEGORY_LABEL[story?.category ?? 'otro'] ?? CATEGORY_LABEL.otro}.`,
      memberNames.length ? `Miembros: ${memberNames.join(', ')}.` : '',
      'Tu objetivo es sugerir planes, citas y actividades: ideas creativas para hacer juntos, restaurantes o lugares locales si te dicen dónde están, e ideas de citas virtuales o juegos si están a distancia.',
      upcomingPlans ? `Planes próximos que ya tienen (evita repetirlos, puedes complementarlos):\n${upcomingPlans}` : '',
      'Responde siempre en español, con calidez y cercanía. Sé concreto: propón 2 o 3 ideas accionables como máximo, con detalles breves. Usa listas cortas cuando ayuden. No inventes datos de la historia que no conoces.',
    ].filter(Boolean).join('\n\n')

    // Historial (viene en orden descendente): invertir y mapear a turnos del modelo.
    // El primer turno debe ser 'user'; se descartan mensajes de la IA anteriores a él.
    const history: ChatTurn[] = (historyRes.data ?? []).reverse()
      .map(m => ({ role: m.role === 'ai' ? 'assistant' as const : 'user' as const, content: m.text }))
    while (history.length && history[0].role === 'assistant') history.shift()
    const turns: ChatTurn[] = [...history, { role: 'user', content: trimmed }]

    const reply = (await CALLERS[provider](model, system, turns))
      || 'Lo siento, no pude generar una respuesta. Inténtalo de nuevo.'

    const { data: aiMessage, error: aiInsertError } = await admin.from('messages')
      .insert({ story_id, sender_id: null, text: reply, role: 'ai' })
      .select().single()
    if (aiInsertError) throw aiInsertError

    return json({ userMessage, aiMessage })
  } catch (error) {
    console.error('ai-chat error:', error)
    const message = error instanceof Error ? error.message : 'Error inesperado'
    return json({ error: message }, 500)
  }
})
