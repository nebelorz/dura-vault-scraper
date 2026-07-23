export const VALID_VOCATIONS: readonly string[] = [
  'None',
  'Knight',
  'Elite Knight',
  'Paladin',
  'Royal Paladin',
  'Druid',
  'Elder Druid',
  'Sorcerer',
  'Master Sorcerer',
] as const;

export function isValidVocation(value: string): boolean {
  return VALID_VOCATIONS.includes(value);
}
