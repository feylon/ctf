import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
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
import type { Request as ExpressRequest } from 'express';
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

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('send-otp')
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
    @ApiOperation({ summary: 'Tizimga kirish' })
    @ApiResponse({ status: 200, description: 'Token qaytariladi' })
    @ApiResponse({ status: 401, description: 'Login yoki parol xato' })
    async login(@Body() loginDto: LoginDto, @Request() req: ExpressRequest) {
        // IP manzilni olish
        const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

        return await this.authService.login(loginDto, ip);
    }

    @Post('refresh')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Access tokenni yangilash' })
    @ApiBody({ type: RefreshDto })
    @ApiResponse({ status: 200, description: 'Yangi access token qaytarildi' })
    @ApiResponse({ status: 401, description: 'Token yaroqsiz' })
    async refresh(@Request() req, @Body() dto: RefreshDto) {
        return await this.authService.refresh(req.user.userId, dto.refresh_token);
    }

    @Post('logout')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Tizimdan chiqish (Logout)' })
    @ApiResponse({ status: 200, description: 'Muvaffaqiyatli chiqdingiz' })
    async logout(@Request() req) {
        return await this.authService.logout(req.user.userId);
    }


    @Post('change-password')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Parolni o\'zgartirish' })
    @ApiBody({ type: ChangePasswordDto })
    @ApiResponse({ status: 200, description: 'Parol muvaffaqiyatli yangilandi' })
    @ApiResponse({ status: 400, description: 'Eski parol noto\'g\'ri' })
    async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
        return await this.authService.changePassword(req.user.sub, dto);
    }

    @Get('me')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Foydalanuvchi profilini olish' })
    @ApiResponse({ status: 200, description: 'User ma\'lumotlari qaytariladi' })
    async getMe(@Request() req) {
        // req.user.sub (token ichidagi user ID)
        return await this.authService.getInfo(req.user.userId);
    }


    @Get('history')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Login tarixini pagination bilan olish' })
    @ApiResponse({ status: 200, description: 'Login tarixi qaytarildi' })
    async getHistory(@Request() req, @Query() query: HistoryQueryDto) {
        return await this.authService.getLoginHistory(req.user.userId, query);
    }



    // auth/auth.controller.ts

    @Post('check-username')
    @ApiOperation({ summary: 'Username band yoki band emasligini tekshirish' })
    @ApiResponse({ status: 200, description: 'Tekshiruv natijasi qaytariladi' })
    async checkUsername(@Body() dto: CheckUsernameDto) {
        return await this.authService.checkUsername(dto.username);
    }


    @Post('forgot-password')
    @ApiOperation({ summary: 'Parolni tiklash uchun OTP yuborish' })
    @ApiResponse({ status: 201, description: 'Tiklash kodi emailga yuborildi' })
    @ApiResponse({ status: 400, description: 'Email topilmadi' })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return await this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'OTP kodni tasdiqlab, yangi parol o\'rnatish' })
    @ApiResponse({ status: 200, description: 'Parol muvaffaqiyatli tiklandi' })
    @ApiResponse({ status: 401, description: 'OTP xato yoki muddati tugagan' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return await this.authService.resetPassword(dto);
    }
}