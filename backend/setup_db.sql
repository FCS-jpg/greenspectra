-- Run this in Supabase SQL Editor to set up the diagnosis_history table.

CREATE TABLE IF NOT EXISTS diagnosis_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  disease TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  treatment JSONB,
  image_url TEXT,
  heatmap_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE diagnosis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own diagnoses" ON diagnosis_history
  FOR ALL USING (auth.uid() = user_id);
