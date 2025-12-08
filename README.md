# Dura Vault Scraper

> A robust, type-safe Node.js + TypeScript scraper for Dura Vault highscores, with PostgreSQL persistence and modern tooling.

---

## 🚀 What does this project do?

Dura Vault Scraper automates the daily download of Dura Vault highscores, stores historical snapshots, and calculates the top 25 gainers for each section, all in a PostgreSQL database optimized for queries and analysis.

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
  v
temp_highscore_snapshots (raw daily data)
  |
  v
highscore_top25 (top 25 gainers per section)
```

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

### highscore_top25

| Column      | Type      | Description                        |
| ----------- | --------- | ---------------------------------- |
| id          | SERIAL PK | Unique identifier                  |
| scrape_date | DATE      | Top 25 calculation date            |
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

### highscore_top25

| scrape_date | section    | name      | level | points   | vocation | rank | gain_points | gain_level | gain_rank |
| ----------- | ---------- | --------- | ----- | -------- | -------- | ---- | ----------- | ---------- | --------- |
| 2025-12-07  | experience | PlayerOne | 120   | 12345678 | Knight   | 1    | 50000       | 1          | 2         |
| 2025-12-07  | magic      | MageX     | 90    | null     | Sorcerer | 3    | null        | 0          | 1         |

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

**What happens if I change data in temp_highscore_snapshots and recalculate the top 25?**

Existing records in highscore_top25 for the same day, section, and character are not overwritten. If you want to update, you must manually delete those records first.

**Why are there fields like gain_rank?**

To analyze not only point or level gains, but also improvements in global ranking position.

**Can I add new sections to the scraper?**

Yes, just add the section in the configuration and the system will handle it automatically.

---

## 📋 Requirements

- Node.js 18+
- PostgreSQL 13+
- npm 9+

---

## 📄 License

MIT
