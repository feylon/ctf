// auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException, Inject } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entity/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginHistory } from 'src/entity/login-history.entity';
import { HistoryQueryDto } from './dto/history-query.dto';

@Injectable()
export class AuthService {
    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private mailerService: MailerService,
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(LoginHistory) private loginHistoryRepo: Repository<LoginHistory>,

        private jwtService: JwtService,
        private readonly config: ConfigService

    ) { }

    private async logLogin(userId: string | null, ip: string, status: 'success' | 'failed') {
        // 1. Dastlabki obyektni yaratamiz (user dan tashqari)
        const historyData: any = {
            ipAddress: ip,
            status: status,
            location: 'Tashkent'
        };

        // 2. Agar userId bo'lsa, user bog'lanishini qo'shamiz
        if (userId) {
            historyData.user = { id: userId };
        }

        // 3. TypeORM create metodiga uzatamiz
        const history = this.loginHistoryRepo.create(historyData);

        await this.loginHistoryRepo.save(history);
    }



    async sendOtp(email: string) {
        // User allaqachon bormi?
        const existingUser = await this.userRepo.findOne({ where: { email } });
        if (existingUser) throw new BadRequestException('Email allaqachon band');

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Redis ga 5 daqiqaga saqlash
        await this.cacheManager.set(`otp_${email}`, otp, 300000);

        await this.mailerService.sendMail({
            to: email,
            subject: 'CTF Platform Tasdiqlash Kodingiz',
            text: `Sizning tasdiqlash kodingiz: ${otp}. Kod 5 daqiqa davomida amal qiladi.`,
        });

        return { message: 'OTP email manzilingizga yuborildi' };
    }

    async register(dto: RegisterDto) {
        const { email, otp, password, fullName, username } = dto;

        const savedOtp = await this.cacheManager.get(`otp_${email}`);
        console.log(savedOtp)
        if (!savedOtp || savedOtp !== otp) {
            throw new UnauthorizedException('OTP xato yoki muddati tugagan');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = this.userRepo.create({
            username,
            email,
            passwordHash: hashedPassword,
            fullName, // Entityingizga fullName qo'shganingizni tekshiring
        });

        await this.userRepo.save(newUser);
        await this.cacheManager.del(`otp_${email}`); // OTP ni ishlatgandan keyin o'chirish

        return { message: 'Ro\'yxatdan o\'tish muvaffaqiyatli yakunlandi' };
    }



    // auth/auth.service.ts

    async login(dto: LoginDto, ip: string) {
        // 1. Userni topish
        const user = await this.userRepo.findOne({
            where: { username: dto.username },
            select: { id: true, username: true, role: true, passwordHash: true }
        });

        // Parol tekshiruvi
        const isPasswordValid = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;

        if (!user || !isPasswordValid) {
            // Muvaffaqiyatsiz urinishni loglash
            await this.logLogin(null, ip, 'failed');
            throw new UnauthorizedException('Login yoki parol noto\'g\'ri');
        }

        // 2. Tokenlarni yaratish
        const payload = { sub: user.id, username: user.username, role: user.role };

        const access_token = this.jwtService.sign(payload, {
            secret: this.config.get<string>('JWT_SECRET'),
            expiresIn: '1d',
        });

        const refresh_token = this.jwtService.sign(payload, {
            secret: this.config.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });

        // 3. Refresh tokenni Redis ga saqlash (7 kun)
        await this.cacheManager.set(`refresh_token:${user.id}`, refresh_token, 604800000);

        // 4. Muvaffaqiyatli loginni loglash
        await this.logLogin(user.id, ip, 'success');

        return {
            access_token,
            refresh_token,
            user: { id: user.id, username: user.username, role: user.role }
        };
    }

    async refresh(userId: string, oldRefreshToken: string) {
        // 1. Redis dan tokenni tekshirish
        const savedToken = await this.cacheManager.get(`refresh_token:${userId}`);

        if (!savedToken || savedToken !== oldRefreshToken) {
            throw new UnauthorizedException('Yaroqsiz refresh token');
        }

        // 2. Yangi access token yaratish
        const user = await this.userRepo.findOneBy({ id: userId });
        const payload = { sub: user!.id, username: user!.username, role: user!.role };

        const access_token = this.jwtService.sign(payload, {
            secret: this.config.get<string>('JWT_SECRET'),
            expiresIn: '15m',
        });

        return { access_token };
    }

    async logout(userId: string) {
        // Redis dan o'chirish
        await this.cacheManager.del(`refresh_token:${userId}`);
        return { message: 'Tizimdan chiqdingiz' };
    }


    async changePassword(userId: string, dto: ChangePasswordDto) {
        // 1. Userni bazadan topish (parol bilan birga)
        const user = await this.userRepo.findOne({
            where: { id: userId },
            select: {
                id: true,
                passwordHash: true
            }
        });

        if (!user) throw new UnauthorizedException('Foydalanuvchi topilmadi');

        // 2. Eski parolni tekshirish
        const isMatch = await bcrypt.compare(dto.oldPassword, user.passwordHash);
        if (!isMatch) {
            throw new BadRequestException('Eski parol noto\'g\'ri');
        }

        // 3. Yangi parolni hash qilish va saqlash
        const newHashedPassword = await bcrypt.hash(dto.newPassword, 10);
        user.passwordHash = newHashedPassword;

        await this.userRepo.save(user);

        return { message: 'Parol muvaffaqiyatli yangilandi' };
    }


    async getInfo(userId: string) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                role: true,
                score: true,
                createdAt: true,
                // passwordHash ni kiritmaymiz, xavfsizlik uchun
            },
        });

        if (!user) {
            throw new UnauthorizedException('Foydalanuvchi topilmadi');
        }

        return user;
    }
    async getLoginHistory(userId: string, query: HistoryQueryDto) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        // Repository orqali to'g'ridan-to'g'ri user ID ustunini filterlaymiz
        const [data, total] = await this.loginHistoryRepo.findAndCount({
            where: {
                user: { id: userId }
            },
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }


    async checkUsername(username: string) {
        const existingUser = await this.userRepo.findOne({
            where: { username },
            select: { id: true }, // Faqat ID ni olish tezroq ishlaydi
        });

        if (existingUser) {
            return { available: false, message: 'Bu username allaqachon band' };
        }

        return { available: true, message: 'Bu username bo\'sh' };
    }
}