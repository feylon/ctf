import { Body, Controller, Get, HttpCode, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiCreatedResponse,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RefreshDto } from './dto/refresh.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { CheckUsernameDto } from './dto/check-username.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { getClientIp } from '../common/helpers/ip.helper';

// Tashqi xizmatlarni (email) suiiste'mol qilishdan himoya: 1 daqiqada 5 ta so'rov
const STRICT_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('send-otp')
    @Throttle(STRICT_THROTTLE)
    @ApiOperation({
        summary: 'OTP yuborish',
        description:
            "Foydalanuvchining email manziliga 6 xonali OTP kodini yuboradi.",
    })
    @ApiBody({ type: SendOtpDto })
    @ApiCreatedResponse({
        description: 'OTP muvaffaqiyatli yuborildi.',
        schema: {
            example: {
                message: 'OTP email manzilingizga yuborildi',
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'Email allaqachon ro‘yxatdan o‘tgan.',
        schema: {
            example: {
                statusCode: 400,
                message: 'Email allaqachon band',
                error: 'Bad Request',
            },
        },
    })
    async sendOtp(@Body() dto: SendOtpDto) {
        return this.authService.sendOtp(dto.email);
    }

    @Post('register')
    @Throttle({ default: { limit: 10, ttl: 60_000 } })
    @ApiOperation({
        summary: "Ro'yxatdan o'tish",
        description:
            "OTP kodi tasdiqlangandan so'ng yangi foydalanuvchini yaratadi.",
    })
    @ApiBody({ type: RegisterDto })
    @ApiCreatedResponse({
        description: "Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi.",
        schema: {
            example: {
                message: "Ro'yxatdan o'tish muvaffaqiyatli yakunlandi",
            },
        },
    })
    @ApiUnauthorizedResponse({
        description: 'OTP noto‘g‘ri yoki muddati tugagan.',
        schema: {
            example: {
                statusCode: 401,
                message: 'OTP xato yoki muddati tugagan',
                error: 'Unauthorized',
            },
        },
    })
    @ApiBadRequestResponse({
        description: "Noto'g'ri so'rov.",
    })
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }


    @Post('login')
    @HttpCode(200)
    @Throttle({ default: { limit: 10, ttl: 60_000 } })
    @ApiOperation({ summary: 'Tizimga kirish (username yoki email orqali)' })
    @ApiResponse({ status: 200, description: 'Token qaytariladi' })
    @ApiResponse({ status: 401, description: 'Login yoki parol xato' })
    async login(@Body() loginDto: LoginDto, @Req() req: Request) {
        return await this.authService.login(loginDto, getClientIp(req));
    }

    @Post('refresh')
    @HttpCode(200)
    @ApiOperation({ summary: 'Refresh token orqali yangi token juftligini olish' })
    @ApiBody({ type: RefreshDto })
    @ApiResponse({ status: 200, description: 'Yangi access va refresh token qaytarildi' })
    @ApiResponse({ status: 401, description: 'Token yaroqsiz' })
    async refresh(@Body() dto: RefreshDto) {
        return await this.authService.refresh(dto.refresh_token);
    }

    @Post('logout')
    @HttpCode(200)
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Tizimdan chiqish (Logout)' })
    @ApiResponse({ status: 200, description: 'Muvaffaqiyatli chiqdingiz' })
    async logout(@CurrentUser() user: AuthUser) {
        return await this.authService.logout(user.id);
    }


    @Post('change-password')
    @HttpCode(200)
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Parolni o\'zgartirish' })
    @ApiBody({ type: ChangePasswordDto })
    @ApiResponse({ status: 200, description: 'Parol muvaffaqiyatli yangilandi' })
    @ApiResponse({ status: 400, description: 'Eski parol noto\'g\'ri' })
    async changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
        return await this.authService.changePassword(user.id, dto);
    }

    @Get('me')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Foydalanuvchi profilini olish' })
    @ApiResponse({ status: 200, description: 'User ma\'lumotlari qaytariladi' })
    async getMe(@CurrentUser() user: AuthUser) {
        return await this.authService.getInfo(user.id);
    }

    @Patch('me')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Profil ma\'lumotlarini tahrirlash' })
    @ApiBody({ type: UpdateProfileDto })
    async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
        return await this.authService.updateProfile(user.id, dto);
    }


    @Get('history')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Login tarixini pagination bilan olish' })
    @ApiResponse({ status: 200, description: 'Login tarixi qaytarildi' })
    async getHistory(@CurrentUser() user: AuthUser, @Query() query: HistoryQueryDto) {
        return await this.authService.getLoginHistory(user.id, query);
    }

    @Post('check-username')
    @HttpCode(200)
    @ApiOperation({ summary: 'Username band yoki band emasligini tekshirish' })
    @ApiResponse({ status: 200, description: 'Tekshiruv natijasi qaytariladi' })
    async checkUsername(@Body() dto: CheckUsernameDto) {
        return await this.authService.checkUsername(dto.username);
    }


    @Post('forgot-password')
    @Throttle(STRICT_THROTTLE)
    @ApiOperation({ summary: 'Parolni tiklash uchun OTP yuborish' })
    @ApiResponse({ status: 201, description: 'Tiklash kodi emailga yuborildi' })
    @ApiResponse({ status: 400, description: 'Email topilmadi' })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return await this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @HttpCode(200)
    @Throttle({ default: { limit: 10, ttl: 60_000 } })
    @ApiOperation({ summary: 'OTP kodni tasdiqlab, yangi parol o\'rnatish' })
    @ApiResponse({ status: 200, description: 'Parol muvaffaqiyatli tiklandi' })
    @ApiResponse({ status: 401, description: 'OTP xato yoki muddati tugagan' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return await this.authService.resetPassword(dto);
    }
}