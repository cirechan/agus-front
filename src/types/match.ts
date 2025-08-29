export interface PlayerSlot {
  playerId: string;
  position: string;
  number?: number;
}

export interface MatchEvent {
  id?: string;
  matchId: string;
  minute: number;
  type: string;
  playerId?: string;
  description?: string;
  createdAt?: Date;
}

export interface Match {
  id?: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoff: Date;
  lineup?: PlayerSlot[];
  events?: MatchEvent[];
  createdAt?: Date;
  updatedAt?: Date;
}
