# Dura Vault Scraper

> A robust, type-safe Node.js + TypeScript scraper for Dura Vault highscores and online players, with PostgreSQL persistence and modern tooling.

---

## 🚀 What does this project do?

Dura Vault Scraper automates the daily download of Dura Vault highscores and tracks which players are online throughout the day, storing historical snapshots and calculating top gainers, losses, and most active online players, all in a PostgreSQL database optimized for queries and analysis.

**Key Features:**

- ✅ Experience gains tracking (points-based)
- ✅ Experience losses tracking (separate `experience_loss` section)
- ✅ Skill gains tracking (level-based: magic, fishing, shield, etc.)
- ✅ Historical snapshots retention
- ✅ Automatic rank and position changes calculation
- ✅ Online players tracking every 15 minutes
- ✅ Accurate online time accumulation (delta-based, drift-proof)
- ✅ Daily top 100 most active online players

---

## 🗺️ Architecture & Data Flow

### Highscores — step 1: scraper (daily)

```
src/highscore/highscores-scraper.ts (entrypoint)
  |
  v
mainHighscoresScraper (highscore/scraper/scraper.ts)
  |
  v
insertHighscoreSnapshots (highscore/db/highscores-data-insert.ts)
  └─> temp_highscore_snapshots (raw daily data)
```

### Highscores — step 2: daily insert (daily EOD)

```
src/highscore/highscores-daily-insert.ts (entrypoint)
  |
  v
processHighscoreTop (highscore/db/highscores-data-insert.ts)
  |
  +----> insertTopGainers()
  |      └─> experience section only (points > 0)
  |
  +----> insertExperienceLosses()
  |      └─> experience_loss section (points < 0)
  |
  +----> insertTopSkillGainers() per section
         └─> magic, fishing, shield, etc. (level > 0)

Final: highscore_top table contains all top gainers + losses
```

### Online players — step 1: scraper (every 15 min)

```
src/online/online-scraper.ts (entrypoint)
  |
  v
mainOnlineScraper (online/scraper/scraper.ts)
  |
  v
upsertOnlineSnapshots (online/db/repository.ts)
  └─> temp_online_snapshots (UPSERT — accumulates online_time)
      - delta calculated from online_scraper_metadata.last_run_at
      - cap of 60 min to avoid gaps from reconnecting players
```

### Online players — step 2: daily insert (daily EOD)

```
src/online/online-daily-insert.ts (entrypoint)
  |
  +----> insertOnlineTop()             → online_top (top 100 by online_time)
  +----> truncateTempOnlineSnapshots() → clears temp table
```

**Data Types:**

- **HighscoreSection:** Official game sections (experience, magic, shield, distance, club, sword, axe, fist, fishing)
- **CustomSection:** Project-specific sections (experience_loss)
- **Section:** Union of both types

---

## 🗄️ Table Structure (PostgreSQL)

### temp_highscore_snapshots

| Column      | Type      | Description                         |
| ----------- | --------- | ----------------------------------- |
| id          | SERIAL PK | Unique identifier                   |
| scrape_date | DATE      | Snapshot date                       |
| section     | VARCHAR   | Highscore section (e.g. experience) |
| level       | INT       | Character's current level           |
| points      | BIGINT    | Current points (exp, skills, etc.)  |
| name        | VARCHAR   | Character name                      |
| vocation    | VARCHAR   | Character vocation                  |
| rank        | INT       | Global rank in official highscores  |

**UNIQUE:** (scrape_date, section, name)

### temp_online_snapshots

| Column        | Type        | Description                             |
| ------------- | ----------- | --------------------------------------- |
| id            | SERIAL PK   | Unique identifier                       |
| scrape_date   | DATE        | Snapshot date                           |
| name          | VARCHAR     | Character name                          |
| level         | INT         | Character's current level               |
| vocation      | VARCHAR     | Character vocation                      |
| online_time   | INT         | Accumulated online minutes today        |
| first_seen_at | TIMESTAMPTZ | UTC timestamp of first online detection |
| last_seen_at  | TIMESTAMPTZ | UTC timestamp of last online detection  |

**UNIQUE:** (scrape_date, name)

### online_top

Same structure as `temp_online_snapshots`. Contains the top 100 players by `online_time` per day, inserted at EOD.

**UNIQUE:** (scrape_date, name)

### online_scraper_metadata

| Column      | Type        | Description                       |
| ----------- | ----------- | --------------------------------- |
| id          | INT PK      | Always 1 (single-row table)       |
| last_run_at | TIMESTAMPTZ | UTC timestamp of last scraper run |

Used to calculate the real delta between scraper executions.

### highscore_top

| Column      | Type      | Description                        |
| ----------- | --------- | ---------------------------------- |
| id          | SERIAL PK | Unique identifier                  |
| scrape_date | DATE      | Top gainers calculation date       |
| section     | VARCHAR   | Highscore section                  |
| level       | INT       | Character's current level          |
| points      | BIGINT    | Current points                     |
| name        | VARCHAR   | Character name                     |
| vocation    | VARCHAR   | Character vocation                 |
| rank        | INT       | Global rank in official highscores |
| gain_points | BIGINT    | Points gained since previous day   |
| gain_level  | INT       | Levels gained since previous day   |
| gain_rank   | INT       | Ranks climbed since previous day   |

**UNIQUE:** (scrape_date, section, name)

---

## 📦 Quick Start

### 1. Install dependencies

```sh
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
HIGHSCORES_SCRAPER_BASE_URL=https://example.com
HIGHSCORES_SCRAPER_PAGES_TO_SCRAP=5
ONLINE_SCRAPER_URL=https://example.com/?online
PGHOST=db
PGUSER=youruser
PGPASSWORD=yourpassword
PGDATABASE=yourdb
PGPORT=yourPostgreSQLport
```

### 3. Initialize the database

```sh
npm run start:db
```

### 4. Run the scrapers

```sh
# Highscores scraper — scrape + write to temp_highscore_snapshots (daily)
npm run start:highscores:scraper

# Highscores daily insert — temp → production tables (daily EOD)
npm run start:highscores:daily-insert

# Online scraper — scrape + write to temp_online_snapshots (every 15 min)
npm run start:online:scraper

# Online daily insert — temp → production tables + truncate (daily EOD)
npm run start:online:daily-insert
```

---

## 🧩 Project Structure

| Folder/File                                | Description                              |
| ------------------------------------------ | ---------------------------------------- |
| src/                                       | Main source code                         |
| src/highscore/highscores-scraper.ts        | Highscores scraper entrypoint (daily)    |
| src/highscore/highscores-daily-insert.ts   | Highscores daily insert entrypoint (EOD) |
| src/highscore/config.ts                    | Highscore-specific configuration         |
| src/highscore/scraper/scraper.ts           | Scraping and parsing orchestration       |
| src/highscore/scraper/parse.ts             | HTML parsing logic                       |
| src/highscore/db/repository.ts             | DB queries and inserts                   |
| src/highscore/db/highscores-data-insert.ts | DB insert orchestration (temp + final)   |
| src/highscore/types/                       | TypeScript types for highscore feature   |
| src/online/online-scraper.ts               | Online scraper entrypoint (every 15 min) |
| src/online/online-daily-insert.ts          | Online daily insert entrypoint (EOD)     |
| src/online/config.ts                       | Online-specific configuration            |
| src/online/scraper/scraper.ts              | Online scraper orchestration             |
| src/online/scraper/parse.ts                | Online HTML parsing logic                |
| src/online/db/repository.ts                | Online DB queries and upserts            |
| src/online/db/schema.ts                    | Online table SQL definitions             |
| src/online/types/                          | TypeScript types for online feature      |
| src/db/config.ts                           | Shared DB connection config              |
| src/db/pool.ts                             | Shared PostgreSQL pool                   |
| src/db/init-db.ts                          | Database initialization script           |
| src/utils/                                 | Shared utilities (fetch-html, logger)    |
| .github/workflows/online-scraper.yml       | Online scraper workflow (every 15 min)   |
| .github/workflows/highscores-scraper.yml   | Highscores scraper workflow (daily)      |
| .github/workflows/db-daily-insert.yml      | Daily DB insert workflow (EOD)           |

---

## 📝 Example Data in the Database

### temp_highscore_snapshots

| scrape_date | section    | name      | level | points   | vocation | rank |
| ----------- | ---------- | --------- | ----- | -------- | -------- | ---- |
| 2025-12-07  | experience | PlayerOne | 120   | 12345678 | Knight   | 1    |
| 2025-12-07  | magic      | MageX     | 90    | null     | Sorcerer | 3    |

### highscore_top - Experience Gains

| scrape_date | section    | name      | level | points   | vocation | rank | gain_points | gain_level | gain_rank |
| ----------- | ---------- | --------- | ----- | -------- | -------- | ---- | ----------- | ---------- | --------- |
| 2025-12-08  | experience | PlayerOne | 121   | 12445678 | Knight   | 1    | 100000      | 1          | 0         |

### highscore_top - Experience Losses

| scrape_date | section         | name      | level | points   | vocation | rank | gain_points | gain_level | gain_rank |
| ----------- | --------------- | --------- | ----- | -------- | -------- | ---- | ----------- | ---------- | --------- |
| 2025-12-08  | experience_loss | PlayerTwo | 120   | 11234567 | Paladin  | 5    | -1000000    | 0          | 1         |

### highscore_top - Skill Gains

| scrape_date | section | name   | level | points | vocation | rank | gain_points | gain_level | gain_rank |
| ----------- | ------- | ------ | ----- | ------ | -------- | ---- | ----------- | ---------- | --------- |
| 2025-12-08  | magic   | MageX  | 92    | null   | Sorcerer | 3    | null        | 2          | 0         |
| 2025-12-08  | fishing | Fisher | 75    | null   | Knight   | 8    | null        | 1          | 1         |

**Note:**

- `experience` and `experience_loss` use `gain_points` (points column)
- Other sections (magic, fishing, shield, etc.) use `gain_level` (level column)
- `gain_points` is `null` for skill sections

---

## 🛠️ Useful Commands

### Linting

```sh
npm run eslint
```

### Manually initialize the database

```sh
npm run start:db
```

### Run the scrapers

```sh
# Highscores scraper (daily)
npm run start:highscores:scraper

# Highscores daily insert — temp → production (daily EOD)
npm run start:highscores:daily-insert

# Online scraper (every 15 min)
npm run start:online:scraper

# Online daily insert — temp → production (daily EOD)
npm run start:online:daily-insert
```

---

## 🧠 FAQ

**Why are experience gains and losses in separate sections?**

Separating `experience` (gains) and `experience_loss` (losses) allows for cleaner data organization and independent analysis. This mirrors the project's approach of distinguishing between official game sections and custom analytical sections.

**How are gains calculated differently for different sections?**

- **Experience section:** Gains are based on `points` column (experience points). Both positive gains and negative losses are tracked.
- **Skill sections** (magic, fishing, shield, etc.): Gains are based on `level` column only, since `points` is always `null` for these sections.

**What happens if a player dies and loses experience?**

The loss is automatically detected and inserted into the `experience_loss` section with a negative `gain_points` value. It doesn't appear in the `experience` section (which only tracks positive gains).

**Why are there fields like gain_rank?**

To analyze not only point or level gains, but also improvements in global ranking position.

**Can I add new sections to the scraper?**

Yes, just add the section in the configuration and the system will handle it automatically. If it's an official game section, add it to `HighscoreSection` type. For custom analytical sections, add it to `CustomSection` type.

**What if the scraper doesn't run on a particular day?**

The system checks for data from the previous day before calculating gains. If no data exists for yesterday, it will skip the gainers insert with a warning log.

## ⏱️ Workflow Scheduling & Cron Jobs

GitHub Actions for this project are managed externally via [cron-job.org](https://cron-job.org/). Each workflow is triggered independently via `workflow_dispatch` through the GitHub API.

| Workflow           | File                     | Schedule         | Purpose                                         |
| ------------------ | ------------------------ | ---------------- | ----------------------------------------------- |
| Online Scraper     | `online-scraper.yml`     | Every 15 min     | Scrape online players → `temp_online_snapshots` |
| Highscores Scraper | `highscores-scraper.yml` | Once daily       | Scrape highscores → `temp_highscore_snapshots`  |
| Daily DB Insert    | `db-daily-insert.yml`    | Once daily (EOD) | DB init + move temp data → production tables    |

> **First deployment:** trigger `db-daily-insert` manually once before activating the scrapers in cron-job.org. This initializes all tables and indexes.

- **Check cron job status:** [https://2cdd12ry.status.cron-job.org/](https://2cdd12ry.status.cron-job.org/)

---

## 📋 Requirements

- Node.js 18+
- PostgreSQL 13+
- npm 9+

---

## 📄 License

MIT
