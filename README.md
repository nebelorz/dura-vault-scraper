# Dura Vault Scraper

A robust, type-safe Node.js + TypeScript scraper for Dura Vault highscores, with PostgreSQL persistence and modern tooling.

## Features

- Scrapes highscores from configurable sections
- Stores snapshots in PostgreSQL
- TypeScript strictness and ESLint 9+ linting
- Docker-ready and production-friendly

## Quick Start

### 1. Install dependencies

```sh
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```
SCRAPER_BASE_URL=https://example.com
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

- Development (TypeScript, hot reload):
  ```sh
  npm run start:dev
  ```
- Production (compiled):
  ```sh
  npm run build
  npm start
  ```

## Linting

Run ESLint on all source files:

```sh
npm run lint
```

## Project Structure

- `src/` — Source code (core, db, utils, types)
- `dist/` — Compiled output
- `config/` — Configuration
- `.env` — Environment variables

## Requirements

- Node.js 18+
- PostgreSQL 13+
- npm 9+

## License

MIT
