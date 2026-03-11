# Docker Guide for dura-vault-scraper

> **Run the Dura Vault Scraper and PostgreSQL database in containers for easy local development and production.**

---

## 🐳 Overview & Architecture

This project uses Docker Compose to orchestrate both the PostgreSQL database and the scraper app. The scraper does NOT run automatically on container start—you trigger it manually for full control.

| Step | Component                              | Description                      |
| ---- | -------------------------------------- | -------------------------------- |
| 1    | highscore/main.ts (daily EOD)          | Orchestrates scraping and DB     |
| 2    | highscore/scraper/scraper.ts           | Scraper logic                    |
| 3    | highscore/db/highscores-data-insert.ts | Database logic                   |
| 4    | temp_highscore_snapshots (DB)          | Stores raw snapshots             |
| 5    | highscore_top (DB)                     | Stores daily top gainers         |
| 6    | online/main.ts (every 15 min)          | Scrapes and upserts online data  |
| 7    | online/online-data-insert.ts (EOD)     | Inserts top 100 + truncates temp |
| 8    | temp_online_snapshots (DB)             | Accumulates online time per day  |
| 9    | online_top (DB)                        | Stores daily top 100 online      |

Flow: **highscore/main.ts → mainHighscoresScraper → mainHighscoresDb → temp_highscore_snapshots → highscore_top**

---

## Prerequisites

- Docker Desktop installed
- `.env` file configured in the project root (see below)

---

## 🚀 Quick Start (Docker Compose - Recommended)

### 1. Start services (database + scraper container)

```sh
docker-compose up --build
```

This will:

- Start the PostgreSQL database container
- Initialize the database schema
- Build the scraper container (but NOT run the scraper)

### 2. Run the scraper manually (each time you want to scrape)

**Run compiled JavaScript:**

```sh
# Highscores (daily EOD)
docker-compose run --rm scraper node dist/highscore/main.js

# Online scraper (15-min tick)
docker-compose run --rm scraper node dist/online/main.js

# Online EOD (top 100 + truncate temp)
docker-compose run --rm scraper node dist/online/online-data-insert.js
```

**Run TypeScript directly (for development/debug):**

```sh
# Highscores
docker-compose run --rm scraper npx ts-node src/highscore/main.ts

# Online scraper
docker-compose run --rm scraper npx ts-node src/online/main.ts

# Online EOD
docker-compose run --rm scraper npx ts-node src/online/online-data-insert.ts
```

### 3. View scraper logs

```sh
docker logs dura-vault-scraper
```

### 4. Stop all services

```sh
docker-compose down
```

### 5. Stop and remove volumes (deletes all data)

```sh
docker-compose down -v
```

---

## 🛠️ Manual Docker Commands (Without Compose)

### Build the image

```sh
docker build -t dura-vault-scraper .
```

### Run the container (database must be running separately)

```sh
docker run --env-file .env dura-vault-scraper
```

### Run TypeScript directly (for development/debug)

```sh
docker-compose run --rm scraper npx ts-node src/highscore/main.ts
```

## 🔎 Useful Docker Commands

### Access PostgreSQL console

```sh
docker exec -it dura-vault-db psql -U $PGUSER -d $PGDATABASE
```

### View running containers

```sh
docker ps
```

### View all containers (including stopped)

```sh
docker ps -a
```

### View volumes

```sh
docker volume ls
```

### Remove unused images

```sh
docker image prune -a
```

---

## ⚙️ Environment Variables

Define these in your `.env` file:

- `PGHOST` - Database host (`db` for Docker Compose, `host.docker.internal` for local)
- `PGPORT` - Database port (default: 5432)
- `PGUSER` - Database user
- `PGPASSWORD` - Database password
- `PGDATABASE` - Database name
- `HIGHSCORES_SCRAPER_BASE_URL` - Base URL for highscores scraping
- `HIGHSCORES_SCRAPER_PAGES_TO_SCRAP` - Number of pages to scrape
- `ONLINE_SCRAPER_URL` - Full URL of the online players page

---

## 🧩 Typical Workflow

1. `docker-compose up --build` (start DB and scraper container)
2. `docker-compose run --rm scraper node dist/highscore/main.js` (run highscores)
3. `docker-compose run --rm scraper node dist/online/main.js` (run online tick)
4. `docker-compose run --rm scraper node dist/online/online-data-insert.js` (run online EOD)
5. Check logs, query the database, repeat as needed

---

## 🐞 Troubleshooting

**Container exits immediately**

- This is normal. The scraper only runs when you trigger it manually.

**Database connection refused**

- Make sure the `db` container is running: `docker ps`
- Check that `PGHOST=db` in your `docker-compose.yml`

**Changes not reflected**

- Rebuild the image: `docker-compose up --build`

**Port already in use**

- Stop local PostgreSQL or change the port in `.env`

---

## 📄 License

MIT
