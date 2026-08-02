# 1-bosqich: Build
FROM node:24-alpine AS builder

WORKDIR /usr/src/web

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 2-bosqich: Production (Nitro server SPA ni beradi)
FROM node:24-alpine

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001
WORKDIR /usr/src/web

COPY --from=builder /usr/src/web/.output ./.output

USER node
EXPOSE 3001

# NUXT_PUBLIC_API_BASE ishga tushirish vaqtida beriladi (runtime config)
CMD ["node", ".output/server/index.mjs"]
