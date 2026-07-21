// src/admin/admin.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminService } from './admin.service';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { Role } from 'global/types';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateChallengeGroupDto, UpdateChallengeGroupDto } from './dto/challenge-group.dto';
import { CreateChallengeDto } from './dto/challenge.dto';
import { AdjustScoreDto } from './dto/adjust-score.dto';
import { UpdateTournamentSettingsDto } from './dto/tournament-settings.dto';

@Controller('admin') 
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== USERS MANAGEMENT ====================

  @ApiTags('Admin - Users')
  @Get('users')
  @Roles(Role.ADMIN) 
  @ApiOperation({ summary: 'Barcha foydalanuvchilarni paginatsiya va qidirish orqali olish' })
  @ApiResponse({ status: 200, description: 'Foydalanuvchilar ro\'yxati va meta ma\'lumotlar' })
  async getUsers(@Query() query: GetUsersQueryDto) {
    return await this.adminService.getAllUsers(query);
  }
  
  @ApiTags('Admin - Users')
  @Patch('users/:id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Foydalanuvchini bloklash yoki faollashtirish' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return await this.adminService.updateUserStatus(id, dto);
  }

  @ApiTags('Admin - Users')
  @Patch('users/:id/role')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Foydalanuvchi rolini o\'zgartirish (user, moderator, admin)' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return await this.adminService.updateUserRole(id, dto);
  }

  @ApiTags('Admin - Users')
  @Delete('users/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Foydalanuvchini soft-delete qilish' })
  async deleteUser(@Param('id') id: string) {
    return await this.adminService.deleteUser(id);
  }

  // ==================== CHALLENGE GROUPS MANAGEMENT ====================

  @ApiTags('Admin - Challenge Groups')
  @Post('groups')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Yangi Challenge guruhi yaratish' })
  async createGroup(@Body() dto: CreateChallengeGroupDto) {
    return await this.adminService.createGroup(dto);
  }

  @ApiTags('Admin - Challenge Groups')
  @Get('groups')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Barcha Challenge guruhlarini olish' })
  async getAllGroups() {
    return await this.adminService.getAllGroups();
  }

  @ApiTags('Admin - Challenge Groups')
  @Put('groups/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Challenge guruhini tahrirlash' })
  async updateGroup(
    @Param('id') id: string,
    @Body() dto: UpdateChallengeGroupDto,
  ) {
    return await this.adminService.updateGroup(id, dto);
  }

  @ApiTags('Admin - Challenge Groups')
  @Delete('groups/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Challenge guruhini o\'chirish' })
  async deleteGroup(@Param('id') id: string) {
    return await this.adminService.deleteGroup(id);
  }




  @ApiTags('Admin - Challenges')
  @Post('challenges')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Yangi Challenge (vazifa) yaratish' })
  async createChallenge(@Body() dto: CreateChallengeDto) {
    return await this.adminService.createChallenge(dto);
  }

  @ApiTags('Admin - Challenges')
  @Get('challenges')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Barcha Challenge larni olish' })
  async getAllChallenges() {
    return await this.adminService.getAllChallenges();
  }

  @ApiTags('Admin - Challenges')
  @Delete('challenges/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Challenge ni o\'chirish' })
  async deleteChallenge(@Param('id') id: string) {
    return await this.adminService.deleteChallenge(id);
  }


  @ApiTags('Admin - Teams')
  @Get('teams')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Barcha jamoalarni reyting (score) bo\'yicha olish' })
  async getAllTeams() {
    return await this.adminService.getAllTeams();
  }

  @ApiTags('Admin - Teams')
  @Delete('teams/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Jamoani o\'chirish va a\'zolarini bo\'shatish' })
  async deleteTeam(@Param('id') id: string) {
    return await this.adminService.deleteTeam(id);
  }

  // src/admin/admin.controller.ts ichiga qo'shiladigan route:

  @ApiTags('Admin - Submissions')
  @Get('submissions')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Barcha yuborilgan flaglar (submissions) tarixini ko‘rish' })
  async getAllSubmissions() {
    return await this.adminService.getAllSubmissions();
  }


  @ApiTags('Admin - Teams')
    @Patch('teams/:id/score')
    @Roles(Role.ADMIN, Role.MODERATOR)
    @ApiOperation({ summary: 'Jamoa ballarini qo‘lda o‘zgartirish (bonus yoki jarima)' })
    async adjustTeamScore(
        @Param('id') teamId: string,
        @Body() dto: AdjustScoreDto,
    ) {
        return await this.adminService.adjustTeamScore(teamId, dto);
    }




    // src/admin/admin.controller.ts ichiga qo'shiladigan routelar:

    @ApiTags('Admin - Moderation')
    @Patch('users/:id/ban')
    @Roles(Role.ADMIN, Role.MODERATOR)
    @ApiOperation({ summary: 'Foydalanuvchini bloklash yoki blokdan chiqarish' })
    async toggleUserBan(@Param('id') userId: string) {
        return await this.adminService.toggleUserBan(userId);
    }

    @ApiTags('Admin - Moderation')
    @Patch('teams/:id/ban')
    @Roles(Role.ADMIN, Role.MODERATOR)
    @ApiOperation({ summary: 'Jamoani bloklash yoki blokdan chiqarish' })
    async toggleTeamBan(@Param('id') teamId: string) {
        return await this.adminService.toggleTeamBan(teamId);
    }



    @ApiTags('Admin - Tournament Settings')
    @Get('settings')
    @Roles(Role.ADMIN, Role.MODERATOR)
    @ApiOperation({ summary: 'Musobaqa sozlamalarini ko‘rish' })
    async getTournamentSettings() {
        return await this.adminService.getTournamentSettings();
    }

    @ApiTags('Admin - Tournament Settings')
    @Patch('settings')
    @Roles(Role.ADMIN, Role.MODERATOR)
    @ApiOperation({ summary: 'Musobaqa holati va vaqtlarini o‘zgartirish' })
    async updateTournamentSettings(@Body() dto: UpdateTournamentSettingsDto) {
        return await this.adminService.updateTournamentSettings(dto);
    }
}