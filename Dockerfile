FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV NODE_ENV=production
RUN npm run build
# Remove devDependencies to shrink image size
RUN npm prune --production

# By default, only initialize the database. To run the scraper read README_DOCKER.md
CMD node dist/db/init-db.js
