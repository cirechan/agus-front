-- Migration to add opponent notes column to matches
ALTER TABLE IF NOT EXISTS partidos
  ADD COLUMN IF NOT EXISTS notas_rival TEXT;
