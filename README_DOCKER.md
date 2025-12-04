# Docker Guide for dura-vault-scraper

This project uses Docker and Docker Compose for local development and production deployment.

## Prerequisites

- Docker Desktop installed
- `.env` file configured in the project root

---

## Quick Start (Docker Compose - Recommended)

### 1. Start services (database + scraper)

```bash
docker-compose up --build
```

This will:

- Create and start the PostgreSQL database container
- Build and create the scraper container
- Initialize the database schema
- The scraper will be ready to run

### 2. Run the scraper manually

```bash
docker start dura-vault-scraper
```

### 3. View scraper logs

```bash
docker logs dura-vault-scraper
```

### 4. Stop all services

```bash
docker-compose down
```

### 5. Stop and remove volumes (deletes all data)

```bash
docker-compose down -v
```

---

## Docker Commands (Manual - Without Compose)

### Build the image

```bash
docker build -t dura-vault-scraper .
```

### Run the container

```bash
docker run --env-file .env dura-vault-scraper
```

---

## Useful Commands

### Access PostgreSQL console

```bash
docker exec -it dura-vault-db psql -U postgres -d classic_dura
```

### View running containers

```bash
docker ps
```

### View all containers (including stopped)

```bash
docker ps -a
```

### View volumes

```bash
docker volume ls
```

### Restart the scraper

```bash
docker restart dura-vault-scraper
```

### Remove unused images

```bash
docker image prune -a
```

---

## Environment Variables

The following variables must be defined in your `.env` file:

- `PGHOST` - Database host (use `db` for Docker Compose, `host.docker.internal` for local)
- `PGPORT` - Database port (default: 5432)
- `PGUSER` - Database user
- `PGPASSWORD` - Database password
- `PGDATABASE` - Database name
- `SCRAPER_BASE_URL` - Base URL for scraping

## Troubleshooting

### Container exits immediately

- This is normal. The scraper runs once and exits.
- Use `docker start dura-vault-scraper` to run it again.

### Database connection refused

- Ensure PostgreSQL container is running: `docker ps`
- Check that `PGHOST=db` in your environment (for Docker Compose)

### Changes not reflected

- Rebuild the image: `docker-compose up --build`

### Port already in use

- Stop local PostgreSQL service or change the port in `.env`
