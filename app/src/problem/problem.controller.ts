import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ProblemService } from './problem.service';
import { ProblemQueryDto } from './dto/problem-query.dto';
import { SubmitProblemDto } from './dto/submit-problem.dto';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/optional-jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AuthUser } from 'src/common/types/auth-user';

@ApiTags('Problems - Ochiq masalalar')
@Controller('problems')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) { }

  @Get()
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Masalalar ro\'yxati (token berilsa yechilganlik holati ham qaytadi)' })
  @ApiResponse({ status: 200, description: 'Masalalar ro\'yxati va meta ma\'lumotlar' })
  async getProblems(@Query() query: ProblemQueryDto, @CurrentUser() user?: AuthUser) {
    return await this.problemService.getProblemsWithPagination(query, user?.id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Masala toifalari va ulardagi masalalar soni' })
  async getCategories() {
    return await this.problemService.getCategories();
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Masalalar bo‘yicha foydalanuvchilar reytingi' })
  async getLeaderboard(@Query() query: LeaderboardQueryDto) {
    return await this.problemService.getLeaderboard(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Bitta masalaning to\'liq shartini o\'qish' })
  async getProblemDetail(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user?: AuthUser) {
    return await this.problemService.getProblemDetail(id, user?.id);
  }

  @Get(':id/submissions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Shu masala bo‘yicha mening urinishlarim' })
  async getMySubmissions(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return await this.problemService.getMySubmissions(user.id, id);
  }

  @Post(':id/submit')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Masalaga javob (flag) yuborish va ball olish' })
  @ApiResponse({ status: 200, description: 'Javob natijasi va ball qo\'shilishi' })
  async submitProblem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitProblemDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.problemService.submitProblem(user.id, id, dto);
  }
}
