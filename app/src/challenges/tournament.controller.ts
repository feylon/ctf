// src/challenges/tournament.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';

// Tizimga kirmagan foydalanuvchilar uchun ham ochiq ma'lumotlar
@ApiTags('Tournament - Ochiq ma‘lumotlar')
@Controller('tournament')
export class TournamentController {
  constructor(private readonly challengesService: ChallengesService) { }

  @Get('status')
  @ApiOperation({ summary: 'Musobaqa holati va vaqtlari' })
  async getStatus() {
    return await this.challengesService.getTournamentStatus();
  }

  @Get('scoreboard')
  @ApiOperation({ summary: 'Ochiq reyting jadvali' })
  async getScoreboard() {
    return await this.challengesService.getLeaderboard();
  }

  @Get('scoreboard/timeline')
  @ApiOperation({ summary: 'Top-10 jamoaning ball o‘sish grafigi' })
  async getTimeline() {
    return await this.challengesService.getScoreTimeline(10);
  }
}
