CREATE TABLE IF NOT EXISTS plan_calendar_events (
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id, user_id)
);

ALTER TABLE plan_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_events_select_own" ON plan_calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "calendar_events_insert_own" ON plan_calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calendar_events_update_own" ON plan_calendar_events
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calendar_events_delete_own" ON plan_calendar_events
  FOR DELETE USING (auth.uid() = user_id);
