-- Tablas para la gestión de partidos y eventos

CREATE TABLE partidos (
    id          SERIAL PRIMARY KEY,
    equipo_id   INTEGER NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    rival_id    INTEGER NOT NULL REFERENCES rivales(id) ON DELETE CASCADE,
    condicion   TEXT NOT NULL,
    inicio      TIMESTAMPTZ NOT NULL,
    competicion TEXT NOT NULL,
    jornada     INTEGER,
    alineacion  JSONB NOT NULL DEFAULT '[]',
    notas_rival TEXT,
    finalizado  BOOLEAN NOT NULL DEFAULT false,
    marcador    JSONB
);

CREATE TABLE eventos_partido (
    id          SERIAL PRIMARY KEY,
    partido_id  INTEGER NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
    minuto      INTEGER NOT NULL,
    tipo        TEXT NOT NULL,
    jugador_id  INTEGER REFERENCES jugadores(id),
    equipo_id   INTEGER REFERENCES equipos(id),
    rival_id    INTEGER REFERENCES rivales(id),
    datos       JSONB
);

CREATE INDEX eventos_partido_partido_id_idx ON eventos_partido (partido_id);
CREATE INDEX partidos_inicio_idx ON partidos (inicio DESC);
