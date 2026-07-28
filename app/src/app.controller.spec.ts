import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const dataSource = { query: jest.fn() };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: DataSource, useValue: dataSource }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('baza ishlayotganda status "ok" qaytaradi', async () => {
    dataSource.query.mockResolvedValueOnce([{ '?column?': 1 }]);
    await expect(appController.getHealth()).resolves.toMatchObject({ status: 'ok', database: true });
  });

  it('bazaga ulanib bo‘lmasa status "degraded" qaytaradi', async () => {
    dataSource.query.mockRejectedValueOnce(new Error('connection refused'));
    await expect(appController.getHealth()).resolves.toMatchObject({ status: 'degraded', database: false });
  });
});
