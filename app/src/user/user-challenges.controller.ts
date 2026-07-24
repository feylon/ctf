// src/user/user-challenges.controller.ts
import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChallengesService } from '../challenges/challenges.service';
import { CreateTeamDto, JoinTeamDto } from '../challenges/dto/team-action.dto';
import { SubmitFlagDto } from '../challenges/dto/submit-flag.dto';
import { ChallengeQueryDto } from '../challenges/dto/challenge-query.dto';
import { getClientIp } from '../common/helpers/ip.helper';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';

@ApiTags('User - Challenges & Teams')
@Controller('user')
@UseGuards(JwtAuthGuard) // Barcha tizimga kirgan foydalanuvchilar (user, moderator, admin)
@ApiBearerAuth()
export class UserChallengesController {
    constructor(private readonly challengesService: ChallengesService) { }

    // ==================== JAMOALAR ====================

    @Post('teams/create')
    @ApiOperation({ summary: 'Yangi jamoa yaratish (yaratuvchi sardor bo‘ladi)' })
    async createTeam(@CurrentUser() user: AuthUser, @Body() dto: CreateTeamDto) {
        return await this.challengesService.createTeam(user.id, dto.name);
    }

    @Post('teams/join')
    @HttpCode(200)
    @ApiOperation({ summary: 'Taklif kodi orqali jamoaga qo‘shilish' })
    async joinTeam(@CurrentUser() user: AuthUser, @Body() dto: JoinTeamDto) {
        return await this.challengesService.joinTeam(user.id, dto.inviteCode);
    }

    @Post('teams/leave')
    @HttpCode(200)
    @ApiOperation({ summary: 'Jamoadan chiqish' })
    async leaveTeam(@CurrentUser() user: AuthUser) {
        return await this.challengesService.leaveTeam(user.id);
    }

    @Get('teams/my-team')
    @ApiOperation({ summary: 'Mening jamoam: a‘zolar, guruhlar va yechilgan vazifalar' })
    async getMyTeam(@CurrentUser() user: AuthUser) {
        return await this.challengesService.getMyTeam(user.id);
    }

    @Delete('teams/members/:memberId')
    @ApiOperation({ summary: 'A‘zoni jamoadan chiqarish (faqat sardor)' })
    async kickMember(@CurrentUser() user: AuthUser, @Param('memberId', ParseUUIDPipe) memberId: string) {
        return await this.challengesService.kickMember(user.id, memberId);
    }

    @Post('teams/invite-code')
    @HttpCode(200)
    @ApiOperation({ summary: 'Taklif kodini yangilash (faqat sardor)' })
    async regenerateInviteCode(@CurrentUser() user: AuthUser) {
        return await this.challengesService.regenerateInviteCode(user.id);
    }

    // ==================== GURUHLAR ====================

    @Get('groups')
    @ApiOperation({ summary: 'Challenge guruhlari ro‘yxati (jamoa qo‘shilganmi belgisi bilan)' })
    async getGroups(@CurrentUser() user: AuthUser) {
        return await this.challengesService.getGroupsForUser(user.id);
    }

    @Post('groups/:id/join')
    @HttpCode(200)
    @ApiOperation({ summary: 'Jamoani challenge guruhiga qo‘shish' })
    async joinGroup(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) groupId: string) {
        return await this.challengesService.joinChallengeGroup(user.id, groupId);
    }

    // ==================== VAZIFALAR ====================

    @Get('challenges')
    @ApiOperation({ summary: 'Ochilgan vazifalar ro‘yxati (yechilganlik holati bilan)' })
    async getChallenges(@CurrentUser() user: AuthUser, @Query() query: ChallengeQueryDto) {
        return await this.challengesService.getAvailableChallenges(user.id, query.groupId);
    }

    @Get('challenges/:id')
    @ApiOperation({ summary: 'Bitta vazifa tafsilotlari va birinchi yechganlar' })
    async getChallenge(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
        return await this.challengesService.getChallengeDetail(user.id, id);
    }

    @Post('challenges/:id/submit')
    @HttpCode(200)
    @Throttle({ default: { limit: 10, ttl: 60_000 } })
    @ApiOperation({ summary: 'Vazifaga flag yuborish (1 daqiqada 10 ta urinish)' })
    async submitFlag(
        @Param('id', ParseUUIDPipe) challengeId: string,
        @CurrentUser() user: AuthUser,
        @Req() req: Request,
        @Body() dto: SubmitFlagDto,
    ) {
        return await this.challengesService.submitFlag(challengeId, user.id, getClientIp(req), dto.flag);
    }

    // ==================== REYTING ====================

    @Get('leaderboard')
    @ApiOperation({ summary: 'Jamoalar reyting jadvali (Scoreboard)' })
    async getLeaderboard() {
        return await this.challengesService.getLeaderboard();
    }
}
