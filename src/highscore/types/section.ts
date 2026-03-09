export type HighscoreSection =
  | 'experience'
  | 'magic'
  | 'shield'
  | 'distance'
  | 'club'
  | 'sword'
  | 'axe'
  | 'fist'
  | 'fishing';

export type CustomSection = 'experience_loss';

export type Section = HighscoreSection | CustomSection;
