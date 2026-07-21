import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProblemService } from './problem.service';
import { ProblemQueryDto } from './dto/problem-query.dto';
import type { Request } from 'express';

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
}