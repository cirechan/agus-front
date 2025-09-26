import type { PlayerSlot } from "@/types/match";

export type FormationKey = "3-5-2" | "4-3-3" | "4-4-2";

interface FormationOption {
  key: FormationKey;
  label: string;
  /**
   * Ordered list of position codes used when laying out the starting lineup.
   * The goalkeeper (GK) is always included as the first entry even though it
   * is not reflected in the textual formation label.
   */
  positions: string[];
}

export const FORMATION_OPTIONS: FormationOption[] = [
  {
    key: "3-5-2",
    label: "3-5-2",
    positions: [
      "GK",
      "LCB",
      "CB",
      "RCB",
      "LWB",
      "LCM",
      "CM",
      "RCM",
      "RWB",
      "LS",
      "RS",
    ],
  },
  {
    key: "4-3-3",
    label: "4-3-3",
    positions: [
      "GK",
      "LB",
      "LCB",
      "RCB",
      "RB",
      "LCM",
      "CM",
      "RCM",
      "LW",
      "ST",
      "RW",
    ],
  },
  {
    key: "4-4-2",
    label: "4-4-2",
    positions: [
      "GK",
      "LB",
      "LCB",
      "RCB",
      "RB",
      "LM",
      "LCM",
      "RCM",
      "RM",
      "LS",
      "RS",
    ],
  },
];

export const DEFAULT_FORMATION_KEY: FormationKey = "3-5-2";

export const FORMATIONS_MAP: Record<FormationKey, string[]> = FORMATION_OPTIONS.reduce(
  (acc, option) => {
    acc[option.key] = option.positions;
    return acc;
  },
  {} as Record<FormationKey, string[]>
);

export function getFormationPositions(key: FormationKey | string): string[] {
  if (key in FORMATIONS_MAP) {
    return FORMATIONS_MAP[key as FormationKey];
  }
  return FORMATIONS_MAP[DEFAULT_FORMATION_KEY];
}

export function detectFormation(lineup: PlayerSlot[]): FormationKey {
  const fieldPositions = lineup
    .filter((slot) => slot.role === "field" && slot.position)
    .map((slot) => slot.position as string);

  for (const option of FORMATION_OPTIONS) {
    if (fieldPositions.length !== option.positions.length) {
      continue;
    }
    const fieldSet = new Set(fieldPositions);
    const matches = option.positions.every((pos) => fieldSet.has(pos));
    if (matches) {
      return option.key;
    }
  }

  return DEFAULT_FORMATION_KEY;
}
