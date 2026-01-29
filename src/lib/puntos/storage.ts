import { AppData } from './types';
import { INITIAL_ROSTER } from './constants';

const STORAGE_KEY = 'cadet_force_data_v1';
const API_BASE = (process.env.NEXT_PUBLIC_PUNTOS_API_URL || '').replace(/\/$/, '');
const API_PATH = process.env.NEXT_PUBLIC_PUNTOS_API_PATH || '/api/puntos';
const normalizedPath = API_PATH.startsWith('/') ? API_PATH : `/${API_PATH}`;
const API_URL = `${API_BASE}${normalizedPath}`;

const DEFAULT_DATA: AppData = {
  players: INITIAL_ROSTER,
  sessions: [],
  logs: [],
};

const isValidData = (data: unknown): data is AppData => {
  if (!data || typeof data !== 'object') return false;
  const record = data as AppData;
  return Array.isArray(record.players) && Array.isArray(record.sessions) && Array.isArray(record.logs);
};

const readLocalFallback = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (isValidData(parsed)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_DATA;
};

export const loadData = async (): Promise<AppData> => {
  try {
    const response = await fetch(API_URL, {
      headers: { Accept: 'application/json' },
    });

    if (response.status === 204 || response.status === 404) {
      return readLocalFallback();
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!isValidData(data)) {
      throw new Error('Invalid data shape');
    }
    return data;
  } catch (error) {
    console.error('Failed to load data from server, using local fallback.', error);
    return readLocalFallback();
  }
};

export const saveData = async (data: AppData) => {
  try {
    const response = await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to save data to server, caching locally.', error);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }
};

export const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 9);
};
