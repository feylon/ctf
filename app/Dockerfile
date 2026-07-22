# 1-bosqich: Build (Node 22 asosida)
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# 2-bosqich: Production (Node 22 asosida)
FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Migratsiyalarni ishga tushirish uchun devDependencies (ts-node, typeorm cli va h.k.) kerak bo'ladi, 
# shuning uchun faqat --only=production qilib qisqartirmaymiz yoki migration uchun kerakli paketlarni saqlaymiz.
RUN npm install

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/tsconfig.json ./

# Uploads papkasini yaratib qo'yamiz
RUN mkdir -p uploads

EXPOSE 3000

# Konteyner ko'tarilganda avval migratsiyani yurgizib, keyin ilovani start qilamiz
# CMD ["sh", "-c", "npm run migration:run && node dist/main"]
# CMD ["sh", "-c", "npm run migration:run && node dist/src/main"]
CMD ["sh", "-c", "npm run migration:run && npm run seed && node dist/src/main"]