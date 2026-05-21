# Docker Guide — dura-vault-scraper

> Run the scraper and PostgreSQL database in isolated containers with full control over when each script runs.

---

## Architecture

Two containers, one network:

```
┌─────────────────────────────────────┐
│         dura-vault-network          │
│                                     │
│  ┌──────────────┐  ┌─────────────┐  │
│  │ dura-vault-db│  │dura-vault-  │  │
│  │ postgres:15  │◄─│  scraper    │  │
│  │ port 5432    │  │  node:24    │  │
│  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────┘
        │
        └─► exposed to host at localhost:5432
            (Beekeeper, psql, etc.)
```

| Container            | Image                   | Role                                    |
| -------------------- | ----------------------- | --------------------------------------- |
| `dura-vault-db`      | `postgres:15-alpine`    | Stores all data persistently            |
| `dura-vault-scraper` | Built from `Dockerfile` | Runs scrapers on demand; idle otherwise |

On startup the scraper container initialises the DB schema automatically, then stays idle waiting for you to run scripts inside it.

---

## Prerequisites

- Docker Desktop running
- `.env` file in the project root (copy from `.env.example`)

---

## Quick Start

### 1. Start both containers

```sh
npm run docker:up
```

- Builds the scraper image
- Starts PostgreSQL and waits for it to pass its health check
- Runs DB schema initialisation once
- Leaves the scraper container idle and ready

Check that both are running:

```sh
docker-compose ps
```

### 2. Open an interactive shell inside the scraper container

```sh
docker exec -it dura-vault-scraper sh
```

You are now inside the container. Run any scraper script:

```sh
# Highscores (daily EOD)
npm run start:highscores:scrape

# Online players (every 15 min tick)
npm run start:online:scrape

# Online EOD — insert top 100 + truncate temp table
npm run start:online:insert-on-db
```

The scraper writes directly to the `dura-vault-db` container over the shared Docker network. No local PostgreSQL needed.

Exit the container shell with `exit` or `Ctrl+D`. The container keeps running.

### 3. Stop everything

```sh
npm run docker:down
// OR
docker-compose down
```

### 4. Stop and delete all data (drops the volume)

```sh
docker-compose down -v
```

---

## Viewing Logs

```sh
# Live logs from the DB container
docker logs dura-vault-db -f

# Last 50 lines from the scraper container
docker logs dura-vault-scraper --tail 50
```

---

## Connecting with any Postgres client

The DB port is exposed to your host machine. Use these settings:

| Field    | Value                                             |
| -------- | ------------------------------------------------- |
| Host     | `db`                                       |
| Port     | value of `PGPORT` in your `.env` |
| Database | value of `PGDATABASE`                             |
| User     | value of `PGUSER`                                 |
| Password | value of `PGPASSWORD`                             |
| SSL      | value of `DB_SSL`                                 |

---

## Environment Variables

All variables are defined in `.env` (copy from `.env.example`).

| Variable                            | Used by      | Notes                                                              |
| ----------------------------------- | ------------ | ------------------------------------------------------------------ |
| `PGHOST`                            | scraper → db | Set to `db` automatically by compose; override only for local runs |
| `PGPORT`                            | both         | Port for the PostgreSQL server                                      |
| `PGDATABASE`                        | both         | DB name                                                            |
| `PGUSER`                            | both         | DB user                                                            |
| `PGPASSWORD`                        | both         | DB password                                                        |
| `DB_SSL`                            | scraper      | `false`. Set `true` only for cloud DBs with SSL                    |
| `HIGHSCORES_SCRAPER_BASE_URL`       | scraper      | Base URL for highscores pages                                      |
| `HIGHSCORES_SCRAPER_PAGES_TO_SCRAP` | scraper      | Number of pages to scrape                                          |
| `ONLINE_SCRAPER_URL`                | scraper      | URL for the online players endpoint                                |
| `ENABLE_DEBUG`                      | scraper      | Set `true` to enable verbose debug logs                            |

---

## Useful Commands

```sh
# Rebuild the scraper image after code changes
docker-compose up --build -d

# Open a shell in the scraper container
docker exec -it dura-vault-scraper sh

# Open a psql console in the DB container
docker exec -it dura-vault-db psql -U $PGUSER -d $PGDATABASE

# List running containers
docker-compose ps

# Remove stopped containers and dangling images
docker-compose down
docker image prune -f
```

---

## 📄 License

MIT
