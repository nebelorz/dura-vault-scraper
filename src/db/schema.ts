export const queryCreateTopHighscoreTable = `
CREATE TABLE IF NOT EXISTS highscore_top (
  id SERIAL PRIMARY KEY,
  scrape_date DATE NOT NULL,
  section VARCHAR(20) NOT NULL,
  level INT NOT NULL,
  points BIGINT,
  name VARCHAR(50) NOT NULL,
  vocation VARCHAR(30) NOT NULL,
  rank INT NOT NULL,
  gain_points BIGINT,
  gain_level INT,
  gain_rank INT,
  UNIQUE (scrape_date, section, name)
);
`;

export const queryCreateTempHighscoreSnapshotsTable = `
CREATE TABLE IF NOT EXISTS temp_highscore_snapshots (
  id SERIAL PRIMARY KEY,
  scrape_date DATE NOT NULL,
  section VARCHAR(20) NOT NULL,
  level INT NOT NULL,
  points BIGINT,
  name VARCHAR(50) NOT NULL,
  vocation VARCHAR(30) NOT NULL,
  rank INT NOT NULL,
  UNIQUE (scrape_date, section, name)
);
`;

export const queryCreateIndexes = `
-- Used by:
--  * player detail / historic function
--  * joins on (name, section, scrape_date)
CREATE INDEX IF NOT EXISTS idx_top_name_section_date
  ON highscore_top (name, section, scrape_date);

-- Used by:
--  * top gainers by period (section + date range)
CREATE INDEX IF NOT EXISTS idx_top_section_date
  ON highscore_top (section, scrape_date);

-- ========================
-- temp_highscore_snapshots
-- ========================
-- This table is short-lived and only used to store days between scrapings.
-- Keep indexes minimal to avoid slowing down inserts.

-- Used to resolve latest snapshot per section/date
CREATE INDEX IF NOT EXISTS idx_temp_section_date
  ON temp_highscore_snapshots (section, scrape_date);

-- Used when matching snapshots by player
CREATE INDEX IF NOT EXISTS idx_temp_name_section_date
  ON temp_highscore_snapshots (name, section, scrape_date);
`;
