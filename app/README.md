# CTF Platform — Backend (NestJS)

To'liq hujjat va ishga tushirish yo'riqnomasi: [../README.md](../README.md).

## Buyruqlar

| Buyruq | Vazifasi |
| --- | --- |
| `npm run start:dev` | Ishlab chiqish rejimi (watch) |
| `npm run build` | Production build (`dist/`) |
| `npm run migration:run` | Migratsiyalarni bajarish (ts-node) |
| `npm run migration:generate ./src/migrations/Nomi` | Entity o'zgarishlaridan migratsiya yaratish |
| `npm run migration:revert` | Oxirgi migratsiyani bekor qilish |
| `npm run seed` | Admin va musobaqa sozlamalarini yaratish |
| `npm test` / `npm run test:e2e` | Unit va e2e testlar |

## API bo'limlari

Barcha endpointlar `/api/v1` prefiksi bilan. To'liq ro'yxat: `/api-docs` (Swagger).

| Bo'lim | Prefiks | Kirish |
| --- | --- | --- |
| Autentifikatsiya | `/auth` | ochiq / token |
| Musobaqa holati, reyting | `/tournament` | ochiq |
| Jamoalar, guruhlar, vazifalar | `/user` | token |
| Masalalar | `/problems` | ochiq (token ixtiyoriy) |
| Yangiliklar | `/news` | ochiq |
| Admin | `/admin` | admin / moderator |
| Holat | `/health` | ochiq |

## Muhit o'zgaruvchilari

[`.env.example`](.env.example) faylida izohlari bilan keltirilgan.
