FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV NODE_ENV=production
RUN npm run build
# Remove devDependencies to shrink image size
RUN npm prune --production

CMD node dist/db/init-db.js && node dist/db/init-db.js && node dist/main.js
