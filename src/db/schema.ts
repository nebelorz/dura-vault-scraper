export const queryCreateHighscoreSnapshotsTable = `
CREATE TABLE IF NOT EXISTS highscore_snapshots (
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
-- Index for filtering by date (useful for "get all data for today")
CREATE INDEX IF NOT EXISTS idx_scrape_date ON highscore_snapshots(scrape_date);

-- Index for finding a specific player across sections (useful for "player profile")
CREATE INDEX IF NOT EXISTS idx_name_section ON highscore_snapshots(name, section);

-- Index for filtering by section and date (useful for "top gainers in magic today")
CREATE INDEX IF NOT EXISTS idx_section_date ON highscore_snapshots(section, scrape_date);

-- Index for historical queries (useful for "player progression over time")
CREATE INDEX IF NOT EXISTS idx_name_section_date ON highscore_snapshots(name, section, scrape_date);
`;
