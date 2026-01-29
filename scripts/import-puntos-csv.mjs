import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = process.argv.slice(2);

const getArg = (name, fallback = null) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx === args.length - 1) return fallback;
  return args[idx + 1];
};

const getMultiArg = (name) => {
  const values = [];
  args.forEach((arg, idx) => {
    if (arg === `--${name}` && idx < args.length - 1) {
      values.push(args[idx + 1]);
    }
  });
  return values;
};

const hasFlag = (name) => args.includes(`--${name}`);

const csvPath = getArg('csv', path.resolve(process.cwd(), '..', 'Puntos 1 Cadete b - Hoja 1.csv'));
const apiUrl = getArg('api', 'https://agus-front.vercel.app/api/puntos');
const baseYear = Number(getArg('base-year', '2025'));
const navidadDate = getArg('navidad', `${baseYear}-12-22`);
const dryRun = hasFlag('dry-run');

const normalizeLabel = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const overrides = new Map();
getMultiArg('override').forEach((entry) => {
  const [label, date] = entry.split('=');
  if (!label || !date) return;
  overrides.set(normalizeLabel(label), date.trim());
});

const parseIsoDate = (value) => {
  const parts = value.split('-').map((part) => part.trim());
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map((part) => Number(part));
  if (!year || !month || !day) return null;
  return { year, month, day };
};

const pad = (value) => String(value).padStart(2, '0');

const monthMap = {
  ene: 1,
  feb: 2,
  mar: 3,
  abr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dic: 12,
};

const parseCsv = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  const headerIndex = lines.findIndex((line) => line.toLowerCase().includes('total'));
  if (headerIndex === -1) {
    throw new Error('No se encontró la cabecera con "Total".');
  }

  const headerCells = lines[headerIndex].split(',').map((cell) => cell.trim());
  const sessionLabels = headerCells.slice(2, -1);
  const rows = lines.slice(headerIndex + 1);

  return { sessionLabels, rows };
};

const parseDates = (labels) => {
  let runningYear = baseYear;
  let lastMonth = null;
  const sessions = [];

  labels.forEach((label) => {
    const normalized = normalizeLabel(label);
    let isoDate = overrides.get(normalized) || null;
    let month = null;
    let year = runningYear;

    if (!isoDate) {
      if (normalized === 'partido navidad') {
        isoDate = navidadDate;
      } else {
        const match = normalized.match(/(\d{1,2})\s+([a-z]{3})/);
        if (!match) {
          throw new Error(`No se pudo interpretar la fecha: "${label}"`);
        }
        const day = Number(match[1]);
        const monthKey = match[2];
        month = monthMap[monthKey];
        if (!month) {
          throw new Error(`Mes desconocido en "${label}"`);
        }
        if (lastMonth !== null && month < lastMonth) {
          runningYear += 1;
        }
        year = runningYear;
        isoDate = `${year}-${pad(month)}-${pad(day)}`;
      }
    }

    const parsedOverride = parseIsoDate(isoDate);
    if (parsedOverride) {
      year = parsedOverride.year;
      month = parsedOverride.month;
      runningYear = year;
      lastMonth = month;
    }

    sessions.push({ label, date: isoDate });
  });

  return sessions;
};

const parsePlayers = (rows) => {
  const players = [];
  const map = new Map();

  rows.forEach((row) => {
    const cells = row.split(',');
    const name = (cells[1] || '').trim();
    if (!name) return;
    const id = crypto.randomUUID();
    players.push({ id, name, isActive: true });
    map.set(name, id);
  });

  return { players, map };
};

const parsePointValue = (rawValue) => {
  const trimmed = rawValue.trim();
  if (!trimmed) return { type: 'empty', value: 0 };
  const normalized = trimmed.toLowerCase();
  if (normalized === 'a' || normalized === 'x' || normalized === 'ausente') {
    return { type: 'absent', value: 0 };
  }
  const parsed = Number(trimmed.replace(',', '.'));
  if (Number.isNaN(parsed)) {
    return { type: 'invalid', value: 0 };
  }
  return { type: 'points', value: parsed };
};

const buildData = (sessionLabels, rows) => {
  const sessionsInfo = parseDates(sessionLabels);
  const { players } = parsePlayers(rows);
  const sessionIds = sessionsInfo.map(() => crypto.randomUUID());
  const sessionAbsences = sessionIds.map(() => new Set());
  const logs = [];
  const warnings = [];

  const playersByRow = [];
  rows.forEach((row) => {
    const cells = row.split(',');
    const name = (cells[1] || '').trim();
    if (!name) return;
    playersByRow.push({ name, cells });
  });

  playersByRow.forEach(({ name, cells }, playerIndex) => {
    const playerId = players[playerIndex].id;
    let computedTotal = 0;

    sessionLabels.forEach((_, sessionIndex) => {
      const rawValue = cells[2 + sessionIndex] ?? '';
      const { type, value } = parsePointValue(rawValue);
      if (type === 'absent') {
        sessionAbsences[sessionIndex].add(playerId);
        return;
      }
      if (type === 'invalid') {
        warnings.push(`Valor inválido para ${name} en sesión ${sessionIndex + 1}: "${rawValue}"`);
        return;
      }
      if (type === 'points') {
        computedTotal += value;
        if (value !== 0) {
          const sessionDate = sessionsInfo[sessionIndex].date;
          const timestamp = new Date(`${sessionDate}T12:00:00Z`).getTime();
          logs.push({
            id: crypto.randomUUID(),
            sessionId: sessionIds[sessionIndex],
            playerId,
            points: value,
            reason: 'Import CSV',
            timestamp,
          });
        }
      }
    });

    const totalCell = cells[2 + sessionLabels.length] ?? '';
    if (totalCell.trim()) {
      const expected = Number(totalCell.trim().replace(',', '.'));
      if (!Number.isNaN(expected) && expected !== computedTotal) {
        warnings.push(`Total distinto para ${name}: CSV=${expected} calculado=${computedTotal}`);
      }
    }
  });

  const sessions = sessionsInfo.map((session, index) => ({
    id: sessionIds[index],
    date: session.date,
    attendees: players.map((player) => player.id),
    absences: Array.from(sessionAbsences[index]),
    completed: true,
    teams: {},
  }));

  const latestDate = sessionsInfo
    .map((session) => session.date)
    .filter(Boolean)
    .sort()
    .pop();

  let meta = undefined;
  if (latestDate) {
    const parsed = parseIsoDate(latestDate);
    if (parsed) {
      const currentQuarter = Math.floor((parsed.month - 1) / 3) + 1;
      meta = { currentQuarter, currentYear: parsed.year };
    }
  }

  return {
    data: {
      players,
      sessions,
      logs,
      meta,
      archives: [],
    },
    sessionsInfo,
    warnings,
  };
};

const run = async () => {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`No existe el CSV: ${csvPath}`);
  }

  const csv = fs.readFileSync(csvPath, 'utf8');
  const { sessionLabels, rows } = parseCsv(csv);
  const { data, sessionsInfo, warnings } = buildData(sessionLabels, rows);

  console.log('Resumen de importacion');
  console.log(`- Jugadores: ${data.players.length}`);
  console.log(`- Sesiones: ${data.sessions.length}`);
  console.log(`- Logs: ${data.logs.length}`);
  console.log(`- Meta: ${data.meta ? `T${data.meta.currentQuarter} ${data.meta.currentYear}` : 'sin meta'}`);
  console.log('- Sesiones:');
  sessionsInfo.forEach((session) => {
    console.log(`  - ${session.label} -> ${session.date}`);
  });

  if (warnings.length > 0) {
    console.log('Avisos:');
    warnings.forEach((warning) => console.log(`- ${warning}`));
  }

  if (dryRun) {
    console.log('Dry run activo, no se envia nada.');
    return;
  }

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error al subir datos (${response.status}): ${text}`);
  }

  console.log(`Datos subidos a ${apiUrl}`);
};

run().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
