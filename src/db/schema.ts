export const queryCreateTop25HighscoreTable = `
CREATE TABLE IF NOT EXISTS highscore_top25 (
  scrape_date DATE NOT NULL,
  section VARCHAR(20) NOT NULL,
  rank INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  vocation VARCHAR(30) NOT NULL,
  level INT NOT NULL,
  points BIGINT,
  gain_points BIGINT,
  gain_level INT,
  UNIQUE(scrape_date, section, rank)
);
`;

export const queryCreateTempHighscoreSnapshotsTable = `
CREATE TABLE IF NOT EXISTS temp_highscore_snapshots (
  id SERIAL PRIMARY KEY,
  scrape_date DATE NOT NULL,
  section VARCHAR(20) NOT NULL,
  rank INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  vocation VARCHAR(30) NOT NULL,
  level INT NOT NULL,
  points BIGINT,
  UNIQUE(scrape_date, section, name)
);
`;

export const queryCreateIndexes = `
-- Indexes for temp_highscore_snapshots
CREATE INDEX IF NOT EXISTS idx_scrape_date ON temp_highscore_snapshots(scrape_date);
CREATE INDEX IF NOT EXISTS idx_name_section ON temp_highscore_snapshots(name, section);
CREATE INDEX IF NOT EXISTS idx_section_date ON temp_highscore_snapshots(section, scrape_date);
CREATE INDEX IF NOT EXISTS idx_name_section_date ON temp_highscore_snapshots(name, section, scrape_date);
-- Indexes for highscore_top25
CREATE INDEX IF NOT EXISTS idx_top25_scrape_date ON highscore_top25(scrape_date);
CREATE INDEX IF NOT EXISTS idx_top25_section_date ON highscore_top25(section, scrape_date);
CREATE INDEX IF NOT EXISTS idx_top25_name_section ON highscore_top25(name, section);
CREATE INDEX IF NOT EXISTS idx_top25_name_section_date ON highscore_top25(name, section, scrape_date);
`;
