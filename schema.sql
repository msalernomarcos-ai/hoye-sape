CREATE TABLE IF NOT EXISTS votos (
  semana     INTEGER NOT NULL,
  votante    TEXT    NOT NULL,
  tipo       TEXT    NOT NULL CHECK (tipo IN ('comida', 'zarpado')),
  objetivo   TEXT    NOT NULL DEFAULT '',
  puntaje    INTEGER NOT NULL CHECK (puntaje BETWEEN 1 AND 10),
  actualizado TEXT   NOT NULL,
  PRIMARY KEY (semana, votante, tipo)
);
