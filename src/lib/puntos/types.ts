export interface Player {
  id: string;
  name: string;
  isActive: boolean;
}

export interface PointLog {
  id: string;
  sessionId: string;
  playerId: string;
  points: number;
  reason: string;
  timestamp: number;
}

export interface TrainingSession {
  id: string;
  date: string;
  attendees: string[];
  absences: string[];
  completed: boolean;
  teams?: Record<string, string>;
}

export interface PointsMeta {
  currentQuarter: number;
  currentYear: number;
  adminSessionId?: string;
}

export interface ArchiveEntry {
  id: string;
  label: string;
  endedAt: number;
  sessions: TrainingSession[];
  logs: PointLog[];
}

export interface AppData {
  players: Player[];
  sessions: TrainingSession[];
  logs: PointLog[];
  meta?: PointsMeta;
  archives?: ArchiveEntry[];
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  SESSION_SETUP = 'SESSION_SETUP',
  SESSION_ACTIVE = 'SESSION_ACTIVE',
  SESSION_SUMMARY = 'SESSION_SUMMARY',
  ROSTER = 'ROSTER',
  HISTORY = 'HISTORY',
}
