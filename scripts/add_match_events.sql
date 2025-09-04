-- Migration to add match events table
CREATE TABLE IF NOT EXISTS eventos_partido (
    id          SERIAL PRIMARY KEY,
    partido_id  INTEGER NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
    minuto      INTEGER NOT NULL,
    tipo        TEXT NOT NULL,
    jugador_id  INTEGER REFERENCES jugadores(id),
    equipo_id   INTEGER REFERENCES equipos(id),
    datos       JSONB
);

CREATE INDEX IF NOT EXISTS eventos_partido_partido_id_idx ON eventos_partido (partido_id);
