# Stage 1: Build client and compile server
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Minimal runtime
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=127.0.0.1
ENV PORT=3000
ENV DATA_DIR=/app/data

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/db/schema.sql ./dist/server/db/schema.sql

RUN mkdir -p /app/data /app/data/backups

EXPOSE 3000
CMD ["node", "dist/server/index.js"]
