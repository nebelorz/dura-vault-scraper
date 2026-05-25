export interface DeathEntry {
  playerName: string;
  killerName: string;
  playerLevel: number;
  diedAt: string; // "YYYY-MM-DD HH:MM:SS" - game server time (America/New_York)
  isPvp: boolean;
}
