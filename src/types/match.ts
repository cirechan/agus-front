export interface PlayerSlot {
  playerId: number;
  /**
   * Player's jersey number. Optional because it may not be defined for all players.
   */
  number?: number;
  /**
   * Indicates whether the player starts on the field or the bench.
   */
  role: 'field' | 'bench' | 'excluded';
  /** Shorthand position code (e.g. GK, LB, ST) used for visual layout. */
  position?: string;
  /** Minutes played by the player in this match. */
  minutes: number;
  /**
   * Second of match when the player entered the field. Used only on the
   * client to compute minutes played automatically and omitted when
   * persisting the lineup.
   */
  enterSecond?: number;
}

export interface MatchScore {
  /** Goles anotados por nuestro equipo. */
  team: number;
  /** Goles encajados frente al rival. */
  rival: number;
}

export interface MatchEvent {
  id: number;
  matchId: number;
  minute: number;
  type: string;
  playerId?: number | null;
  teamId?: number | null;
  rivalId?: number | null;
  /**
   * Additional event metadata stored as JSON in the database.
   */
  data?: Record<string, any> | null;
}

export interface Match {
  id: number;
  teamId: number;
  rivalId: number;
  isHome: boolean;
  /** ISO date string representing kickoff time. */
  kickoff: string;
  /** Tipo de competición: liga, playoff, copa o amistoso. */
  competition: 'liga' | 'playoff' | 'copa' | 'amistoso';
  /** Número de jornada si aplica. */
  matchday?: number | null;
  lineup: PlayerSlot[];
  events: MatchEvent[];
  /** Notes about the opponent or match context. */
  opponentNotes?: string | null;
  /** Indicates whether the match has concluded. */
  finished: boolean;
  /** Resultado final almacenado al cierre del partido. */
  score: MatchScore | null;
}

export type NewMatch = Omit<Match, 'id' | 'finished'>;
export type NewMatchEvent = Omit<MatchEvent, 'id'>;
