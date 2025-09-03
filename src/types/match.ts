export interface PlayerSlot {
  playerId: number;
  /**
   * Player's jersey number. Optional because it may not be defined for all players.
   */
  number?: number;
  /**
   * Indicates whether the player starts on the field or the bench.
   */
  role: 'field' | 'bench';
}

export interface MatchEvent {
  id: number;
  matchId: number;
  minute: number;
  type: string;
  playerId?: number | null;
  teamId?: number | null;
  /**
   * Additional event metadata stored as JSON in the database.
   */
  data?: Record<string, any> | null;
}

export interface Match {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  /** ISO date string representing kickoff time. */
  kickoff: string;
  lineup: PlayerSlot[];
  events: MatchEvent[];
}

export type NewMatch = Omit<Match, 'id'>;
export type NewMatchEvent = Omit<MatchEvent, 'id'>;
