export interface FormationDefinition {
  label: string
  positions: string[]
}

export const FORMATIONS: Record<string, FormationDefinition> = {
  '4-3-3': {
    label: '4-3-3',
    positions: ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LCM', 'CM', 'RCM', 'LW', 'ST', 'RW'],
  },
  '4-4-2': {
    label: '4-4-2',
    positions: ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LM', 'LCM', 'RCM', 'RM', 'LS', 'RS'],
  },
  '4-2-3-1': {
    label: '4-2-3-1',
    positions: ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LDM', 'RDM', 'CAM', 'LW', 'ST', 'RW'],
  },
} as const

export type FormationKey = keyof typeof FORMATIONS

export const DEFAULT_FORMATION_KEY: FormationKey = '4-3-3'

export const FORMATION_OPTIONS = Object.entries(FORMATIONS).map(([value, data]) => ({
  value: value as FormationKey,
  label: data.label,
  positions: data.positions,
}))
