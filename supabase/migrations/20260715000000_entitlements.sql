-- ============================================================================
-- Monetización: entitlements por Historia (Freemium + Stripe)
-- La membresía de pago vive en la Historia (espacio compartido). Cualquier
-- miembro admin puede pagar y el beneficio aplica a todos los miembros.
-- Solo el webhook de Stripe (service-role) escribe esta tabla; los clientes
-- solo pueden leer las entitlements de sus Historias. Imita user_secrets.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.story_entitlements (
  story_id UUID PRIMARY KEY REFERENCES public.stories(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'duo', 'familia')),
  status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'inactive')),
  payer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Búsqueda rápida por customer/subscription desde el webhook (service-role)
CREATE INDEX IF NOT EXISTS idx_story_entitlements_customer
  ON public.story_entitlements (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_story_entitlements_subscription
  ON public.story_entitlements (stripe_subscription_id);
-- Regla "Historias ilimitadas": el usuario pagador puede crear más Historias.
CREATE INDEX IF NOT EXISTS idx_story_entitlements_payer
  ON public.story_entitlements (payer_user_id);

ALTER TABLE public.story_entitlements ENABLE ROW LEVEL SECURITY;

-- Lectura: cualquier miembro de la Historia (reutiliza el helper central,
-- SECURITY DEFINER para evitar recursión de RLS).
DROP POLICY IF EXISTS "story_entitlements_select" ON public.story_entitlements;
CREATE POLICY "story_entitlements_select" ON public.story_entitlements
  FOR SELECT USING (story_id IN (SELECT public.get_user_story_ids()));

-- SIN policies de INSERT/UPDATE/DELETE para clientes:
-- únicamente el webhook de Stripe (service-role, bypassa RLS) escribe aquí.

-- Realtime opt-in: el flip del webhook empuja el cambio de plan en vivo a los
-- clientes suscritos (mismo patrón que stories/messages).
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_entitlements;

-- ----------------------------------------------------------------------------
-- Helper: ¿el usuario actual es pagador con suscripción activa en alguna
-- Historia? Habilita la regla per-usuario de "crear Historias ilimitadas".
-- SECURITY DEFINER para poder leer la tabla sin exponer filas de otros.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_paid_story()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM story_entitlements
    WHERE payer_user_id = auth.uid()
      AND status IN ('active', 'trialing')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.user_has_paid_story() FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.user_has_paid_story() TO authenticated;

-- ----------------------------------------------------------------------------
-- Enforcement del cupo de miembros por Historia. Se hace en la DB porque el
-- alta ocurre vía RPC de auto-unión con código de invitación (el nuevo miembro
-- no es admin y no puede leer el conteo desde el cliente).
--   free / duo → 2 miembros · familia (activa) → 6.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_member_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_cap   INT := 2;
  v_plan  TEXT;
  v_status TEXT;
BEGIN
  SELECT plan, status INTO v_plan, v_status
    FROM story_entitlements WHERE story_id = NEW.story_id;

  IF v_plan = 'familia' AND v_status IN ('active', 'trialing') THEN
    v_cap := 6;
  END IF;

  SELECT count(*) INTO v_count FROM story_members WHERE story_id = NEW.story_id;

  IF v_count >= v_cap THEN
    RAISE EXCEPTION 'MEMBER_CAP_REACHED: esta Historia alcanzó su límite de % miembros', v_cap
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_member_cap ON public.story_members;
CREATE TRIGGER trg_enforce_member_cap
  BEFORE INSERT ON public.story_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_member_cap();
