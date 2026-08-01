# Docker Guide — dura-vault-scraper

> Run the scraper and PostgreSQL database in isolated containers with full control over when each script runs.

---

## Architecture

Two containers, one network:

```
┌──────────────────────────────────────────┐
│    ${COMPOSE_PROJECT_NAME:-dura-vault}   │
│              -network                    │
│                                          │
│  ┌──────────────────┐  ┌──────────────┐  │
│  │ {project}-db     │  │ {project}-   │  │
│  │  postgres:15     │◄─│  scraper     │  │
│  │  port 5432       │  │  node:24     │  │
│  └──────────────────┘  └──────────────┘  │
└──────────────────────────────────────────┘
        │
        └─► exposed to host at localhost:5432
            (Beekeeper, psql, etc.)
```

The project name is configured via `COMPOSE_PROJECT_NAME` in your `.env` file (defaults to `dura-vault`). All container names follow the pattern `{project}-db` and `{project}-scraper`.

| Container                            | Image                   | Role                                    |
| ------------------------------------ | ----------------------- | --------------------------------------- |
| `{COMPOSE_PROJECT_NAME}-db`      | `postgres:15-alpine`    | Stores all data persistently            |
| `{COMPOSE_PROJECT_NAME}-scraper` | Built from `Dockerfile` | Runs scrapers on demand; idle otherwise |

On startup the scraper container initialises the DB schema automatically, then stays idle waiting for you to run scripts inside it.

---

## Prerequisites

- Docker Desktop running
- `.env` file in `env/classic/` (or `env/seasonal/`) — copy from `env/<server>/.env.example`

---

## Quick Start

### 1. Start both containers

```sh
docker compose --env-file env/classic/.env up --build
```

- Builds the scraper image
- Starts PostgreSQL and waits for it to pass its health check
- Runs DB schema initialisation once
- Leaves the scraper container idle and ready

Check that both are running:

```sh
docker compose ps
```

### 2. Open an interactive shell inside the scraper container

```sh
docker exec -it {COMPOSE_PROJECT_NAME}-scraper sh
```

You are now inside the container. Run any scraper script:

```sh
# Highscores scraper — scrape + write to temp_highscore_snapshots (daily)
npm run start:highscores:scraper:classic

# Highscores daily insert — temp → production tables (daily EOD)
npm run start:highscores:daily-insert:classic

# Online scraper — scrape + write to temp_online_snapshots (every 15 min)
npm run start:online:scraper:classic

# Online daily insert — temp → production tables + truncate (daily EOD)
npm run start:online:daily-insert:classic

# Deaths scraper — scrape + write directly to deaths table (every X mins, depends on server player volume)
npm run start:deaths:scraper:classic
```

For the seasonal server, replace `classic` with `seasonal` in each command above.

The scraper writes directly to the DB container over the shared Docker network. No local PostgreSQL needed.

Exit the container shell with `exit` or `Ctrl+D`. The container keeps running.

### 3. Stop everything

```sh
docker compose down
```

### 4. Stop and delete all data (drops the volume)

```sh
docker compose down -v
```

### Seasonal server

To run the seasonal server, use the same compose file with the seasonal env file:

```sh
docker compose --env-file env/seasonal/.env up --build
```

This starts a separate PostgreSQL instance (on a different host port) and a scraper container configured for the seasonal server.

---

## Viewing Logs

```sh
# Live logs from the DB container
docker logs {COMPOSE_PROJECT_NAME}-db -f

# Last 50 lines from the scraper container
docker logs {COMPOSE_PROJECT_NAME}-scraper --tail 50
```

---

## Connecting with any Postgres client

The DB port is exposed to your host machine. Use these settings:

| Field    | Value                                  |
| -------- | -------------------------------------- |
| Host     | `localhost`                            |
| Port     | value of `PGPORT` in your `.env`         |
| Database | value of `PGDATABASE`                    |
| User     | value of `PGUSER`                        |
| Password | value of `PGPASSWORD`                    |
| SSL      | value of `DB_SSL`                        |

---

## Environment Variables

All variables are defined in `env/<server>/.env` (copy from `env/<server>/.env.example`).

| Variable | Used by | Notes |
|---|---|---|
| `SERVER` | scraper | `classic` or `seasonal` — selects which server config to use |
| `COMPOSE_PROJECT_NAME` | compose | Project name for container naming (default: `dura-vault`) |
| `HOST_PORT` | compose | Host port mapped to the DB container (default: `5432`) |
| `PGHOST` | scraper → db | Set to `db` automatically by compose; override only for local runs |
| `PGPORT` | both | Port for the PostgreSQL server |
| `PGDATABASE` | both | DB name |
| `PGUSER` | both | DB user |
| `PGPASSWORD` | both | DB password |
| `DB_SSL` | scraper | `false`. Set `true` only for cloud DBs with SSL |
| `BASE_URL` | scraper | Base URL for all scraper endpoints |
| `HIGHSCORES_PAGES` | scraper | Number of highscore pages to scrape |
| `SERVER_TIMEZONE` | scraper | Server timezone for death timestamps |
| `ENABLE_DEBUG` | scraper | Set `true` to enable verbose debug logs |

Each server gets its own env file (`env/classic/.env` for classic, `env/seasonal/.env` for seasonal).

---

## Useful Commands

```sh
# Rebuild the scraper image after code changes
docker compose --env-file env/classic/.env up --build -d

# Open a shell in the scraper container
docker exec -it {COMPOSE_PROJECT_NAME}-scraper sh

# Open a psql console in the DB container
docker exec -it {COMPOSE_PROJECT_NAME}-db psql -U $PGUSER -d $PGDATABASE

# List running containers
docker compose ps

# Remove stopped containers and dangling images
docker compose down
docker image prune -f
```

---

## 📄 License

MIT
