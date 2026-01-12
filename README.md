# Dura Vault Scraper

> A robust, type-safe Node.js + TypeScript scraper for Dura Vault highscores, with PostgreSQL persistence and modern tooling.

---

## 🚀 What does this project do?

Dura Vault Scraper automates the daily download of Dura Vault highscores, stores historical snapshots, and calculates top gainers and losses for each section, all in a PostgreSQL database optimized for queries and analysis.

**Key Features:**

- ✅ Experience gains tracking (points-based)
- ✅ Experience losses tracking (separate `experience_loss` section)
- ✅ Skill gains tracking (level-based: magic, fishing, shield, etc.)
- ✅ Historical snapshots retention
- ✅ Automatic rank and position changes calculation

---

## 🗺️ Architecture & Data Flow

```
main.ts (entrypoint)
  |
  v
mainScraper (scraper/main-scraper.ts)
  |
  v
mainDb (db/main-db.ts)
  |
  +----> insertTempHighscoreSnapshots()
  |      └─> temp_highscore_snapshots (raw daily data)
  |
  +----> insertTopGainers()
  |      └─> experience section only (points > 0)
  |
  +----> insertTopSkillGainers()
  |      └─> magic, fishing, shield, etc. (level > 0)
  |
  +----> insertExperienceLosses()
         └─> experience_loss section (points < 0)

Final: highscore_top table contains all top gainers + losses
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
SCRAPER_BASE_URL=https://example.com
SCRAPER_PAGES_TO_SCRAP=5
PGHOST=localhost
PGUSER=youruser
PGPASSWORD=yourpassword
PGDATABASE=yourdb
PGPORT=5432
```

### 3. Initialize the database

```sh
npm run start:db
```

### 4. Run the scraper

**Development:**

```sh
npm run start:dev
```

**Production (compiled):**

```sh
npm run start:production
```

---

## 🧩 Project Structure

| Folder/File             | Description                             |
| ----------------------- | --------------------------------------- |
| src/                    | Main source code                        |
| main.ts                 | Entrypoint, orchestrates scraper and DB |
| scraper/                | Scraping and parsing logic              |
| scraper/main-scraper.ts | Scraper main logic                      |
| db/                     | Database access and logic               |
| db/main-db.ts           | DB main logic                           |
| utils/                  | Utilities and helpers                   |
| types/                  | TypeScript types                        |
| dist/                   | Compiled output                         |
| config/                 | Advanced configuration                  |
| .env                    | Environment variables                   |

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

### Run the scraper and database logic

```sh
npm run start:dev        # Development (runs main.ts)
npm run start:production # Production (runs main.ts)
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

## 📋 Requirements

- Node.js 18+
- PostgreSQL 13+
- npm 9+

---

## 📄 License

MIT
