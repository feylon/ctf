// auth/auth.service.ts
import {
    BadRequestException,
    ForbiddenException,
    Inject,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomInt, randomUUID } from 'crypto';
import { User } from '../entity/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginHistory } from 'src/entity/login-history.entity';
import { HistoryQueryDto } from './dto/history-query.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from 'src/common/types/auth-user';

const OTP_TTL = 5 * 60 * 1000; // 5 daqiqa
const OTP_RESEND_COOLDOWN = 60 * 1000; // qayta yuborish uchun 1 daqiqa kutish
const OTP_MAX_ATTEMPTS = 5;
const REFRESH_TTL = 7 * 24 * 60 * 60 * 1000; // 7 kun

type OtpPurpose = 'register' | 'reset';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private mailerService: MailerService,
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(LoginHistory) private loginHistoryRepo: Repository<LoginHistory>,
        private jwtService: JwtService,
        private readonly config: ConfigService,
    ) { }

    // ==================== YORDAMCHI METODLAR ====================

    private async logLogin(userId: string | null, ip: string, status: 'success' | 'failed') {
        const history = this.loginHistoryRepo.create({
            ipAddress: ip,
            status,
            user: userId ? ({ id: userId } as User) : undefined,
        });
        await this.loginHistoryRepo.save(history);
    }

    private otpKey(purpose: OtpPurpose, email: string) {
        return purpose === 'register' ? `otp_${email}` : `reset_otp_${email}`;
    }

    // OTP yaratib, Redis'ga saqlaydi va emailga yuboradi
    private async issueOtp(purpose: OtpPurpose, email: string, subject: string, text: (otp: string) => string) {
        const cooldownKey = `${this.otpKey(purpose, email)}:cooldown`;
        if (await this.cacheManager.get(cooldownKey)) {
            throw new BadRequestException('Kod yaqinda yuborilgan. Iltimos, 1 daqiqadan so\'ng qayta urinib ko\'ring');
        }

        const otp = randomInt(100000, 1000000).toString();
        await this.cacheManager.set(this.otpKey(purpose, email), { otp, attempts: 0 }, OTP_TTL);
        await this.cacheManager.set(cooldownKey, true, OTP_RESEND_COOLDOWN);

        try {
            await this.mailerService.sendMail({ to: email, subject, text: text(otp) });
        } catch (error) {
            this.logger.error(`Email yuborilmadi (${email}): ${(error as Error).message}`);
            await this.cacheManager.del(cooldownKey);
            throw new BadRequestException('Email yuborishda xatolik yuz berdi. Keyinroq urinib ko\'ring');
        }

        if (this.config.get('NODE_ENV') !== 'production') {
            this.logger.debug(`[DEV] ${purpose} OTP ${email}: ${otp}`);
        }
    }

    // OTP ni tekshiradi. Noto'g'ri urinishlar soni cheklangan
    private async verifyOtp(purpose: OtpPurpose, email: string, otp: string) {
        const key = this.otpKey(purpose, email);
        const saved = await this.cacheManager.get<{ otp: string; attempts: number }>(key);

        if (!saved) {
            throw new UnauthorizedException('Kod xato yoki muddati tugagan');
        }

        if (saved.otp !== otp) {
            const attempts = saved.attempts + 1;
            if (attempts >= OTP_MAX_ATTEMPTS) {
                await this.cacheManager.del(key);
                throw new UnauthorizedException('Urinishlar soni tugadi. Yangi kod so\'rang');
            }
            await this.cacheManager.set(key, { ...saved, attempts }, OTP_TTL);
            throw new UnauthorizedException('Kod xato yoki muddati tugagan');
        }

        await this.cacheManager.del(key);
    }

    private async issueTokens(user: Pick<User, 'id' | 'username' | 'role'>) {
        const payload: JwtPayload = { sub: user.id, username: user.username, role: user.role };

        const access_token = this.jwtService.sign(payload, {
            secret: this.config.getOrThrow<string>('JWT_SECRET'),
            expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
        });

        // jti har bir refresh tokenni noyob qiladi (rotatsiya to'g'ri ishlashi uchun)
        const refresh_token = this.jwtService.sign({ ...payload, jti: randomUUID() }, {
            secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        });

        await this.cacheManager.set(`refresh_token:${user.id}`, refresh_token, REFRESH_TTL);

        return { access_token, refresh_token };
    }

    private assertCanLogin(user: Pick<User, 'isActive' | 'isDelete' | 'isBanned'>) {
        if (user.isDelete) {
            throw new UnauthorizedException('Login yoki parol noto\'g\'ri');
        }
        if (user.isBanned) {
            throw new ForbiddenException('Hisobingiz bloklangan. Administratorga murojaat qiling');
        }
        if (!user.isActive) {
            throw new ForbiddenException('Hisobingiz faol emas. Administratorga murojaat qiling');
        }
    }

    // ==================== RO'YXATDAN O'TISH ====================

    async sendOtp(email: string) {
        const existingUser = await this.userRepo.exists({ where: { email } });
        if (existingUser) throw new BadRequestException('Email allaqachon band');

        await this.issueOtp(
            'register',
            email,
            'CTF Platform Tasdiqlash Kodingiz',
            (otp) => `Sizning tasdiqlash kodingiz: ${otp}. Kod 5 daqiqa davomida amal qiladi.`,
        );

        return { message: 'OTP email manzilingizga yuborildi' };
    }

    async register(dto: RegisterDto) {
        const { email, otp, password, fullName, username } = dto;

        if (await this.userRepo.exists({ where: { username } })) {
            throw new BadRequestException('Bu username allaqachon band');
        }
        if (await this.userRepo.exists({ where: { email } })) {
            throw new BadRequestException('Email allaqachon band');
        }

        await this.verifyOtp('register', email, otp);

        const newUser = this.userRepo.create({
            username,
            email,
            passwordHash: await bcrypt.hash(password, 10),
            fullName,
        });
        await this.userRepo.save(newUser);

        return { message: 'Ro\'yxatdan o\'tish muvaffaqiyatli yakunlandi' };
    }

    // ==================== KIRISH / CHIQISH ====================

    async login(dto: LoginDto, ip: string) {
        // Username yoki email orqali kirish mumkin
        const login = dto.username.trim();
        const user = await this.userRepo.findOne({
            where: login.includes('@') ? { email: login.toLowerCase() } : { username: login },
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                passwordHash: true,
                isActive: true,
                isDelete: true,
                isBanned: true,
            },
        });

        const isPasswordValid = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;

        if (!user || !isPasswordValid) {
            await this.logLogin(user?.id ?? null, ip, 'failed');
            throw new UnauthorizedException('Login yoki parol noto\'g\'ri');
        }

        this.assertCanLogin(user);

        const tokens = await this.issueTokens(user);
        await this.logLogin(user.id, ip, 'success');

        return {
            ...tokens,
            user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role },
        };
    }

    async refresh(refreshToken: string) {
        let payload: JwtPayload;
        try {
            payload = this.jwtService.verify<JwtPayload>(refreshToken, {
                secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
            });
        } catch {
            throw new UnauthorizedException('Yaroqsiz refresh token');
        }

        const savedToken = await this.cacheManager.get<string>(`refresh_token:${payload.sub}`);
        if (!savedToken || savedToken !== refreshToken) {
            throw new UnauthorizedException('Yaroqsiz refresh token');
        }

        const user = await this.userRepo.findOne({
            where: { id: payload.sub },
            select: { id: true, username: true, role: true, isActive: true, isDelete: true, isBanned: true },
        });
        if (!user) {
            throw new UnauthorizedException('Foydalanuvchi topilmadi');
        }
        this.assertCanLogin(user);

        // Refresh token rotatsiyasi: eski token endi yaroqsiz bo'ladi
        return await this.issueTokens(user);
    }

    async logout(userId: string) {
        await this.cacheManager.del(`refresh_token:${userId}`);
        return { message: 'Tizimdan chiqdingiz' };
    }

    // ==================== PROFIL ====================

    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            select: { id: true, passwordHash: true },
        });

        if (!user) throw new UnauthorizedException('Foydalanuvchi topilmadi');

        const isMatch = await bcrypt.compare(dto.oldPassword, user.passwordHash);
        if (!isMatch) {
            throw new BadRequestException('Eski parol noto\'g\'ri');
        }
        if (dto.oldPassword === dto.newPassword) {
            throw new BadRequestException('Yangi parol eski paroldan farq qilishi kerak');
        }

        user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
        await this.userRepo.save(user);

        // Boshqa qurilmalardagi sessiyalarni yopamiz
        await this.cacheManager.del(`refresh_token:${userId}`);

        return { message: 'Parol muvaffaqiyatli yangilandi. Qaytadan tizimga kiring' };
    }

    async getInfo(userId: string) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: { team: true },
            select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                role: true,
                score: true,
                createdAt: true,
                team: { id: true, name: true, score: true },
            },
        });

        if (!user) {
            throw new UnauthorizedException('Foydalanuvchi topilmadi');
        }

        return user;
    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('Foydalanuvchi topilmadi');
        }

        if (dto.fullName !== undefined) user.fullName = dto.fullName.trim();
        await this.userRepo.save(user);

        return this.getInfo(userId);
    }

    async getLoginHistory(userId: string, query: HistoryQueryDto) {
        const page = query.page || 1;
        const limit = Math.min(query.limit || 10, 100);
        const skip = (page - 1) * limit;

        const [data, total] = await this.loginHistoryRepo.findAndCount({
            where: { user: { id: userId } },
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
        const exists = await this.userRepo.exists({ where: { username } });

        if (exists) {
            return { available: false, message: 'Bu username allaqachon band' };
        }

        return { available: true, message: 'Bu username bo\'sh' };
    }

    // ==================== PAROLNI TIKLASH ====================

    async forgotPassword(email: string) {
        const user = await this.userRepo.findOne({ where: { email }, select: { id: true, isDelete: true } });

        // Email mavjudligini oshkor qilmaslik uchun javob har doim bir xil
        if (user && !user.isDelete) {
            await this.issueOtp(
                'reset',
                email,
                'CTF Platform Parolni Tiklash Kodi',
                (otp) =>
                    `Sizning parolni tiklash kodingiz: ${otp}. Kod 5 daqiqa davomida amal qiladi. Agar buni siz so'ramagan bo'lsangiz, e'tibor bermang.`,
            );
        }

        return { message: 'Agar bu email ro\'yxatdan o\'tgan bo\'lsa, tiklash kodi yuborildi' };
    }

    async resetPassword(dto: ResetPasswordDto) {
        const { email, otp, newPassword } = dto;

        await this.verifyOtp('reset', email, otp);

        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            throw new BadRequestException('Foydalanuvchi topilmadi');
        }

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        await this.userRepo.save(user);

        // Xavfsizlik uchun barcha faol sessiyalarni yopamiz
        await this.cacheManager.del(`refresh_token:${user.id}`);

        return { message: 'Parol muvaffaqiyatli tiklandi. Endi yangi parol bilan kirishingiz mumkin' };
    }
}
