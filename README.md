# CTF.uz — Capture The Flag platformasi

Jamoaviy CTF musobaqalari va algoritmik masalalar uchun to'liq platforma.

| Qism | Texnologiya | Papka |
| --- | --- | --- |
| Backend API | NestJS 11, TypeORM, PostgreSQL, Redis | [`app/`](app) |
| Frontend | Nuxt 4, Nuxt UI 4, Tailwind CSS 4 | [`web/`](web) |
| Infratuzilma | Docker Compose | [`docker-compose.yml`](docker-compose.yml) |

## Imkoniyatlar

**Ishtirokchilar uchun**
- Email orqali OTP bilan ro'yxatdan o'tish, parolni tiklash, refresh token rotatsiyasi
- Jamoa tuzish, taklif kodi orqali qo'shilish, sardor huquqlari (a'zoni chiqarish, kodni yangilash)
- Challenge guruhlariga qo'shilish, vazifalarni yechish, dinamik ball (har yechimdan keyin kamayadi)
- Jamoalar reytingi va ball o'sish grafigi, masalalar bo'yicha foydalanuvchilar reytingi
- Algoritmik masalalar arxivi: qidiruv, toifa, saralash, urinishlar tarixi
- Yangiliklar, profil, login tarixi

**Admin va moderatorlar uchun**
- Statistika paneli, foydalanuvchilar (rol, ban, faollik, soft-delete/tiklash)
- Guruhlar, vazifalar (vaqt oynasi, IP/CIDR cheklovi, biriktirilgan fayl), masalalar, yangiliklar
- Jamoalar (ball tuzatish, ban), yuborilgan flaglar tarixi
- Fayl menejeri (papkalar, yuklash, havolani nusxalash)
- Musobaqa sozlamalari (faol/to'xtatilgan, global boshlanish va tugash vaqti)

**Xavfsizlik**
- Flaglar bcrypt bilan hashlanadi, javoblarda qaytmaydi
- Flag yuborish tranzaksiya va qulf bilan (parallel so'rovlarda ball ikki marta berilmaydi)
- Rate limiting (login, OTP, flag yuborish), helmet, CORS
- Bloklangan foydalanuvchi eski token bilan ham kira olmaydi
- Fayl yuklashda path traversal himoyasi, xavfli fayllar faqat yuklab olinadi

## Tez ishga tushirish (Docker)

```bash
cp .env.example .env        # parollar va JWT kalitlarini o'zgartiring
docker compose up -d --build
```

- Frontend: http://localhost:3001
- API: http://localhost:3000/api/v1
- Swagger hujjatlari: http://localhost:3000/api-docs
- Admin: `.env` dagi `ADMIN_USERNAME` / `ADMIN_PASSWORD`

API konteyneri ishga tushganda migratsiyalar va seed (admin + musobaqa sozlamalari) avtomatik bajariladi.

> `MAIL_HOST` bo'sh qoldirilsa email yuborilmaydi — OTP kodlar API logida ko'rinadi: `docker logs ctf_api`.

## Lokal ishlab chiqish

Talablar: Node.js 24+, PostgreSQL 15+, Redis 7+.

```bash
# Faqat baza va Redis ni Docker'da ko'tarish
docker compose up -d postgres redis

# Backend
cd app
cp .env.example .env          # DB_PORT=5435 (docker compose tashqi porti)
npm install
npm run migration:run
npm run seed
npm run start:dev             # http://localhost:3000

# Frontend (boshqa terminalda)
cd web
cp .env.example .env
npm install
npm run dev                   # http://localhost:3001
```

## Testlar

```bash
cd app
npm test            # unit testlar
npm run test:e2e    # e2e testlar (PostgreSQL va Redis kerak)
```

## Loyiha tuzilmasi

```
app/                    NestJS backend
  src/auth/             ro'yxatdan o'tish, login, OTP, JWT
  src/challenges/       jamoalar, guruhlar, vazifalar, reyting
  src/problem/          algoritmik masalalar
  src/news/             yangiliklar
  src/admin/            admin API va fayl menejeri
  src/entity/           TypeORM entitylar
  src/migrations/       ma'lumotlar bazasi migratsiyalari
web/                    Nuxt frontend
  app/pages/            sahifalar (admin/ — boshqaruv paneli)
  app/components/       komponentlar
  app/composables/      useApi, useAuth, useTournament ...
```
