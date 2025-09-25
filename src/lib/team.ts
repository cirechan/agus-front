const DEFAULT_PRIMARY_TEAM_ID = 2;

function parseEnvTeamId(value: string | undefined | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
}

export function getPrimaryTeamId(): number {
  const envId =
    parseEnvTeamId(process.env.NEXT_PUBLIC_PRIMARY_TEAM_ID) ??
    parseEnvTeamId(process.env.PRIMARY_TEAM_ID);

  if (envId !== undefined) {
    return envId;
  }

  return DEFAULT_PRIMARY_TEAM_ID;
}

export function resolvePrimaryTeam<T extends { id: number }>(teams: T[]): T | null {
  if (!Array.isArray(teams) || teams.length === 0) {
    return null;
  }

  const primaryTeamId = getPrimaryTeamId();
  const match = teams.find((team) => Number(team.id) === primaryTeamId);
  return match ?? teams[0] ?? null;
}
