# Docker Guide for dura-vault-scraper

> **Run the Dura Vault Scraper and PostgreSQL database in containers for easy local development and production.**

---

## 🐳 Overview & Architecture

This project uses Docker Compose to orchestrate both the PostgreSQL database and the scraper app. The scraper does NOT run automatically on container start—you trigger it manually for full control.

| Step | Component                     | Description                 |
| ---- | ----------------------------- | --------------------------- |
| 1    | Scraper (manual)              | Runs the scraper            |
| 2    | temp_highscore_snapshots (DB) | Stores raw snapshots        |
| 3    | highscore_top25 (DB)          | Stores daily top 25 gainers |

Flow: **Scraper (manual) → temp_highscore_snapshots → highscore_top25**

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
docker exec dura-vault-scraper node dist/main.js
```

**Run TypeScript directly (for development/debug):**

```sh
docker exec dura-vault-scraper npx ts-node src/main.ts
```

_Requires that ts-node and TypeScript are installed in the container._

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
docker exec dura-vault-scraper npx ts-node src/main.ts
```

_Useful for development or debugging. Make sure ts-node is installed in the container._

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
- `SCRAPER_BASE_URL` - Base URL for scraping
- `SCRAPER_PAGES_TO_SCRAP` - Number of pages to scrape

---

## 🧩 Typical Workflow

1. `docker-compose up --build` (start DB and scraper container)
2. `docker exec dura-vault-scraper node dist/main.js` (run the scraper)
3. Check logs, query the database, repeat as needed

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
