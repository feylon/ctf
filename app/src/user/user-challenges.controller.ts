// src/user/user-challenges.controller.ts
import { Body, Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ChallengesService } from '../challenges/challenges.service';
import { CreateTeamDto, JoinTeamDto } from '../challenges/dto/team-action.dto';
import { SubmitFlagDto } from '../challenges/dto/submit-flag.dto';
import type { Request } from 'express';
import { getClientIp } from '../common/helpers/ip.helper';
import { Role } from 'global/types';

@ApiTags('User - Challenges & Teams')
@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard) // JwtGuard va RolesGuard birga ulanadi
@Roles(Role.USER, Role.ADMIN) // Bu yerda ushbu routelarga kimlar kira olishi belgilanadi
@ApiBearerAuth()
export class UserChallengesController {
    constructor(private readonly challengesService: ChallengesService) { }

    @Post('teams/create')
    @ApiOperation({ summary: 'Yangi jamoa yaratish' })
    async createTeam(@Req() req: any, @Body() dto: CreateTeamDto) {
        return await this.challengesService.createTeam(req.user.id, dto.name);
    }

    @Post('teams/join')
    @ApiOperation({ summary: 'Mavjud jamoaga qo‘shilish (max 3 kishi)' })
    async joinTeam(@Req() req: any, @Body() dto: JoinTeamDto) {
        return await this.challengesService.joinTeam(req.user.id, dto.teamId);
    }

    @Get('challenges')
    @ApiOperation({ summary: 'Barcha mavjud vazifalarni ko‘rish' })
    async getChallenges() {
        return await this.challengesService.getAvailableChallenges();
    }

    @Post('challenges/:id/submit')
    @ApiOperation({ summary: 'Vazifaga flag yuborish' })
    async submitFlag(
        @Param('id') challengeId: string,
        @Req() req: Request,
        @Body() dto: SubmitFlagDto,
    ) {
        const userId = (req as any).user.id;
        const clientIp = getClientIp(req);
        return await this.challengesService.submitFlag(challengeId, userId, clientIp, dto.flag);
    }



    @Get('leaderboard')
    @ApiOperation({ summary: 'Jamoalar reyting jadvalini (Scoreboard) ko‘rish' })
    async getLeaderboard() {
        return await this.challengesService.getLeaderboard();
    }



    @Get('teams/my-team')
    @ApiOperation({ summary: 'Mening jamoam haqida ma\'lumot va yechilgan vazifalar' })
    async getMyTeam(@Req() req: any) {
        return await this.challengesService.getMyTeam(req.user.id);
    }
}