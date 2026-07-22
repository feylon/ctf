import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProblemService } from './problem.service';
import { ProblemQueryDto } from './dto/problem-query.dto';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { SubmitProblemDto } from './dto/submit-problem.dto';

@ApiTags('Problems - Ochiq masalalar')
@Controller('problems')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Get()
  @ApiOperation({ summary: 'Masalalar ro\'yxatini sahifalash (pagination) va qidirish bilan olish' })
  @ApiResponse({ status: 200, description: 'Masalalar ro\'yxati va meta ma\'lumotlar' })
  async getProblems(@Query() query: ProblemQueryDto, @Req() req: Request) {
    // Token orqali user kelgan bo'lsa ID sini ajratib olamiz (majburiy emas)
    const user = (req as any).user;
    const userId = user ? user.userId : undefined;

    return await this.problemService.getProblemsWithPagination(query, userId);
  }



  @Get(':id')
  @ApiOperation({ summary: 'Bitta masalaning to\'liq shartini o\'qish' })
  async getProblemDetail(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = (req as any).user;
    const userId = user ? user.userId : undefined;
    return await this.problemService.getProblemDetail(id, userId);
  }

  @Post(':id/submit')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Masalaga javob (flag) yuborish va ball olish' })
  @ApiResponse({ status: 200, description: 'Javob natijasi va ball qo\'shilishi' })
  async submitProblem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitProblemDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    return await this.problemService.submitProblem(userId, id, dto);
  }
}