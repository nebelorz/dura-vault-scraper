export const queryCreateDeathsTable = `
CREATE TABLE IF NOT EXISTS deaths (
	id SERIAL PRIMARY KEY,
	player_name VARCHAR(100) NOT NULL,
	killer_name VARCHAR(100) NOT NULL,
	player_level SMALLINT NOT NULL,
	died_at TIMESTAMPTZ NOT NULL,
	is_pvp BOOLEAN NOT NULL,
	scrape_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (player_name, died_at)
);
`;

export const queryCreateDeathsIndexes = `
CREATE INDEX IF NOT EXISTS idx_deaths_player_name
	ON deaths (player_name);
CREATE INDEX IF NOT EXISTS idx_deaths_died_at
	ON deaths (died_at);
CREATE INDEX IF NOT EXISTS idx_deaths_killer_name
	ON deaths (killer_name);
CREATE INDEX IF NOT EXISTS idx_deaths_is_pvp
	ON deaths (is_pvp);
`;
