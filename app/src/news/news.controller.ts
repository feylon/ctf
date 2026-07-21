// src/news/news.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { NewsQueryDto } from './dto/news-query.dto';

@ApiTags('News - Public Yangiliklar')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  // Eski oddiy getAllNews saqlanishi mumkin yoki shuni o'zini ishlatsangiz bo'ladi
  @Get()
  @ApiOperation({ summary: 'Barcha yangiliklar ro\'yxatini olish (Oddiy)' })
  async getAllNews() {
    return await this.newsService.getAllNews();
  }

  // --- YANGI PAGINATION ENDPOINTI ---
  @Get('pagination')
  @ApiOperation({ summary: 'Yangiliklarni sahifalash (pagination) bilan olish' })
  @ApiResponse({ status: 200, description: 'Sahifikangan yangiliklar va meta ma\'lumotlar' })
  async getNewsWithPagination(@Query() query: NewsQueryDto) {
    return await this.newsService.getNewsWithPagination(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta yangilikni ID orqali batafsil o\'qish (Public)' })
  @ApiResponse({ status: 200, description: 'Yangilik ma\'lumoti' })
  @ApiResponse({ status: 404, description: 'Yangilik topilmadi' })
  async getNewsById(@Param('id') id: string) {
    return await this.newsService.getNewsById(id);
  }
}