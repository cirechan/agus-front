-- Separate rivals from equipos and adjust matches/events
CREATE TABLE IF NOT EXISTS rivales (
    id     SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    color  TEXT NOT NULL DEFAULT '#1d4ed8'
);

-- Move existing opponents from equipos to rivales assuming our team has id 1
INSERT INTO rivales (id, nombre, color)
SELECT id, nombre, COALESCE(color, '#1d4ed8') FROM equipos WHERE id <> 1
ON CONFLICT (id) DO NOTHING;
SELECT setval('rivales_id_seq', (SELECT COALESCE(MAX(id),1) FROM rivales));

-- Adjust partidos table
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS rival_id INTEGER;
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS condicion TEXT;
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS equipo_id INTEGER;

UPDATE partidos
SET rival_id = CASE WHEN equipo_local_id = 1 THEN equipo_visitante_id ELSE equipo_local_id END,
    condicion = CASE WHEN equipo_local_id = 1 THEN 'local' ELSE 'visitante' END,
    equipo_id = 1;

ALTER TABLE partidos DROP COLUMN IF EXISTS equipo_local_id;
ALTER TABLE partidos DROP COLUMN IF EXISTS equipo_visitante_id;
ALTER TABLE partidos ALTER COLUMN rival_id SET NOT NULL;
ALTER TABLE partidos ALTER COLUMN condicion SET NOT NULL DEFAULT 'local';
ALTER TABLE partidos ALTER COLUMN equipo_id SET NOT NULL;
ALTER TABLE partidos
  ADD CONSTRAINT IF NOT EXISTS partidos_equipo_id_fkey FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
  ADD CONSTRAINT IF NOT EXISTS partidos_rival_id_fkey FOREIGN KEY (rival_id) REFERENCES rivales(id) ON DELETE CASCADE;

-- Adjust eventos_partido to support rival reference
ALTER TABLE eventos_partido ADD COLUMN IF NOT EXISTS rival_id INTEGER REFERENCES rivales(id);

-- Remove opponents from equipos
DELETE FROM equipos WHERE id <> 1;
