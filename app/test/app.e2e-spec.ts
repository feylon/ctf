// E2E testlar ishlayotgan PostgreSQL va Redis talab qiladi (.env dagi sozlamalar)
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('CTF API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidUnknownValues: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health - server va baza holati', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => expect(res.body).toMatchObject({ status: 'ok', database: true }));
  });

  it('GET /api/v1/tournament/status - ochiq musobaqa holati', () => {
    return request(app.getHttpServer())
      .get('/api/v1/tournament/status')
      .expect(200)
      .expect((res) => expect(['running', 'paused', 'not_started', 'finished']).toContain(res.body.state));
  });

  it('POST /api/v1/auth/login - noto‘g‘ri ma‘lumot bilan 401', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: 'mavjud_emas_user', password: 'noto_gri_parol' })
      .expect(401);
  });

  it('POST /api/v1/auth/register - validatsiya xatosi 400', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ username: 'a', email: 'not-an-email' })
      .expect(400);
  });

  it('GET /api/v1/user/challenges - tokensiz 401', () => {
    return request(app.getHttpServer()).get('/api/v1/user/challenges').expect(401);
  });

  it('GET /api/v1/admin/stats - tokensiz 401', () => {
    return request(app.getHttpServer()).get('/api/v1/admin/stats').expect(401);
  });

  it('GET /api/v1/problems - ochiq masalalar ro‘yxati', () => {
    return request(app.getHttpServer())
      .get('/api/v1/problems?limit=5')
      .expect(200)
      .expect((res) => expect(res.body.meta).toMatchObject({ page: 1, limit: 5 }));
  });
});
