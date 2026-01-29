import { Player } from './types';

export const INITIAL_ROSTER: Player[] = [
  { id: '1', name: 'Tizi', isActive: true },
  { id: '2', name: 'Carlos', isActive: true },
  { id: '3', name: 'Ricardo', isActive: true },
  { id: '4', name: 'Lucas', isActive: true },
  { id: '5', name: 'Felipe', isActive: true },
  { id: '6', name: 'Hector', isActive: true },
  { id: '7', name: 'Lozano', isActive: true },
  { id: '8', name: 'Jan', isActive: true },
  { id: '9', name: 'Frago', isActive: true },
  { id: '10', name: 'César', isActive: true },
  { id: '11', name: 'Pablo', isActive: true },
  { id: '12', name: 'Diego B.', isActive: true },
  { id: '13', name: 'Santi', isActive: true },
  { id: '14', name: 'Jorge', isActive: true },
  { id: '15', name: 'David', isActive: true },
  { id: '16', name: 'Lorca', isActive: true },
  { id: '17', name: 'Clavería', isActive: true },
  { id: '18', name: 'Pedro', isActive: true },
  { id: '19', name: 'Mateo', isActive: true },
  { id: '20', name: 'Rober', isActive: true },
  { id: '21', name: 'Julio', isActive: true },
];

export const POINT_PRESETS = [
  { label: '+1', value: 1, color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { label: '+2', value: 2, color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { label: '+3', value: 3, color: 'bg-emerald-200 text-emerald-800 border-emerald-400' },
  { label: '+5', value: 5, color: 'bg-emerald-500 text-white border-emerald-600' },
  { label: '-1', value: -1, color: 'bg-rose-100 text-rose-700 border-rose-300' },
  { label: '-2', value: -2, color: 'bg-rose-100 text-rose-700 border-rose-300' },
];
