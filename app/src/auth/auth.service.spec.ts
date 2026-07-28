import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { Role, User } from '../entity/user.entity';
import { LoginHistory } from '../entity/login-history.entity';

describe('AuthService', () => {
  let service: AuthService;
  const store = new Map<string, unknown>();

  const cache = {
    get: jest.fn(async (key: string) => store.get(key)),
    set: jest.fn(async (key: string, value: unknown) => void store.set(key, value)),
    del: jest.fn(async (key: string) => void store.delete(key)),
  };
  const userRepo = {
    findOne: jest.fn(),
    exists: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => v),
  };
  const historyRepo = { create: jest.fn((v) => v), save: jest.fn() };
  const mailer = { sendMail: jest.fn() };
  const config = {
    get: jest.fn((_key: string, def?: unknown) => def),
    getOrThrow: jest.fn((key: string) => `${key}_value`),
  };

  beforeEach(async () => {
    store.clear();
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        { provide: CACHE_MANAGER, useValue: cache },
        { provide: MailerService, useValue: mailer },
        { provide: ConfigService, useValue: config },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(LoginHistory), useValue: historyRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  const activeUser = async (overrides: Partial<User> = {}) => ({
    id: 'u1',
    username: 'ali',
    role: Role.USER,
    passwordHash: await bcrypt.hash('secret12', 4),
    isActive: true,
    isDelete: false,
    isBanned: false,
    ...overrides,
  });

  describe('login', () => {
    it('to‘g‘ri parol bilan token juftligini qaytaradi va refresh tokenni saqlaydi', async () => {
      userRepo.findOne.mockResolvedValue(await activeUser());

      const result = await service.login({ username: 'ali', password: 'secret12' }, '127.0.0.1');

      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
      expect(store.get('refresh_token:u1')).toBe(result.refresh_token);
      expect(historyRepo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });

    it('noto‘g‘ri parolda 401 qaytaradi va urinishni loglaydi', async () => {
      userRepo.findOne.mockResolvedValue(await activeUser());

      await expect(service.login({ username: 'ali', password: 'wrong123' }, '1.1.1.1'))
        .rejects.toBeInstanceOf(UnauthorizedException);
      expect(historyRepo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
    });

    it('bloklangan foydalanuvchini kiritmaydi', async () => {
      userRepo.findOne.mockResolvedValue(await activeUser({ isBanned: true }));

      await expect(service.login({ username: 'ali', password: 'secret12' }, '1.1.1.1'))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('email orqali kirishda email bo‘yicha qidiradi', async () => {
      userRepo.findOne.mockResolvedValue(await activeUser());

      await service.login({ username: 'Ali@Test.UZ', password: 'secret12' }, '1.1.1.1');

      expect(userRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { email: 'ali@test.uz' } }));
    });
  });

  describe('refresh', () => {
    it('refresh tokenni almashtiradi, eskisi qayta ishlamaydi', async () => {
      userRepo.findOne.mockResolvedValue(await activeUser());
      const { refresh_token } = await service.login({ username: 'ali', password: 'secret12' }, '1.1.1.1');

      const rotated = await service.refresh(refresh_token);
      expect(rotated.refresh_token).not.toBe(refresh_token);

      await expect(service.refresh(refresh_token)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('soxta tokenni rad etadi', async () => {
      await expect(service.refresh('not.a.jwt')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('OTP', () => {
    it('ro‘yxatdan o‘tishda noto‘g‘ri kod urinishlarini cheklaydi', async () => {
      userRepo.exists.mockResolvedValue(false);
      await service.sendOtp('new@test.uz');
      expect(mailer.sendMail).toHaveBeenCalled();

      const dto = { email: 'new@test.uz', otp: '000000', password: 'secret12', fullName: 'Yangi', username: 'yangi' };
      for (let i = 0; i < 5; i++) {
        await expect(service.register(dto)).rejects.toBeInstanceOf(UnauthorizedException);
      }
      // 5 ta xato urinishdan keyin kod o'chiriladi
      expect(store.has('otp_new@test.uz')).toBe(false);
    });

    it('to‘g‘ri kod bilan foydalanuvchi yaratiladi', async () => {
      userRepo.exists.mockResolvedValue(false);
      await service.sendOtp('new@test.uz');
      const { otp } = store.get('otp_new@test.uz') as { otp: string };

      await expect(
        service.register({ email: 'new@test.uz', otp, password: 'secret12', fullName: 'Yangi', username: 'yangi' }),
      ).resolves.toEqual({ message: expect.any(String) });
      expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ username: 'yangi', email: 'new@test.uz' }));
    });

    it('parolni tiklashda email mavjudligini oshkor qilmaydi', async () => {
      userRepo.findOne.mockResolvedValue(null);
      const result = await service.forgotPassword('none@test.uz');
      expect(result.message).toBeDefined();
      expect(mailer.sendMail).not.toHaveBeenCalled();
    });
  });
});
