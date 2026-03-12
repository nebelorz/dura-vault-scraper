export const queryCreateTempOnlineSnapshotsTable = `
CREATE TABLE IF NOT EXISTS temp_online_snapshots (
	id SERIAL PRIMARY KEY,
	name VARCHAR(50) NOT NULL,
	level INT NOT NULL,
	vocation VARCHAR(30) NOT NULL,
	online_time INT NOT NULL DEFAULT 0,
	first_seen_at TIMESTAMPTZ NOT NULL,
	last_seen_at TIMESTAMPTZ NOT NULL,
	UNIQUE (name)
);
`;

export const queryCreateOnlineTopTable = `
CREATE TABLE IF NOT EXISTS online_top (
	id SERIAL PRIMARY KEY,
	scrape_date DATE NOT NULL,
	name VARCHAR(50) NOT NULL,
	level INT NOT NULL,
	vocation VARCHAR(30) NOT NULL,
	online_time INT NOT NULL,
	first_seen_at TIMESTAMPTZ NOT NULL,
	last_seen_at TIMESTAMPTZ NOT NULL,
	UNIQUE (scrape_date, name)
);
`;

export const queryCreateOnlineIndexes = `
CREATE INDEX IF NOT EXISTS idx_online_top_date
	ON online_top (scrape_date);
`;

export const queryCreateOnlineScraperMetadataTable = `
CREATE TABLE IF NOT EXISTS online_scraper_metadata (
	id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
	last_run_at TIMESTAMPTZ
);
INSERT INTO online_scraper_metadata (id, last_run_at)
VALUES (1, NULL)
ON CONFLICT (id) DO NOTHING;
`;
