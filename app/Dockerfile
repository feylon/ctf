# 1-bosqich: Build (Node 24 asosida)
FROM node:24-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# 2-bosqich: Production (faqat kerakli paketlar bilan)
FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./
# Build bosqichida dev paketlardan tozalangan node_modules ko'chiriladi
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# Yuklangan fayllar uchun papka (docker-compose da volume ulanadi)
RUN mkdir -p uploads && chown -R node:node /usr/src/app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/v1/health || exit 1

# Konteyner ko'tarilganda avval migratsiya va seed, keyin ilova ishga tushadi
CMD ["sh", "-c", "npm run migration:run:prod && npm run seed:prod && node dist/main"]
