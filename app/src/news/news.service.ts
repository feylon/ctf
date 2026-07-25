// src/news/news.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from '../entity/news.entity';
import { CreateNewsDto } from '../admin/dto/create-news.dto';
import { UpdateNewsDto } from '../admin/dto/update-news.dto';
import { NewsQueryDto } from './dto/news-query.dto';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private readonly newsRepo: Repository<News>,
  ) {}

  // 1. Barcha yangiliklarni olish (Hamma uchun ochiq, oxirgisi birinchi chiqadi)
  async getAllNews() {
    return await this.newsRepo.find({
      relations: { author: true },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        author: {
          id: true,
          username: true,
          fullName: true,
        },
      },
      order: { createdAt: 'DESC' },
    });
  }

  // 2. Bitta yangilikni ID orqali ko'rish
  async getNewsById(id: string) {
    const news = await this.newsRepo.findOne({
      where: { id },
      relations: { author: true },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        author: {
          id: true,
          username: true,
          fullName: true,
        },
      },
    });

    if (!news) {
      throw new NotFoundException('Yangilik topilmadi');
    }
    return news;
  }

  // 3. Yangilik yaratish (Faqat Admin/Moderator)
  async createNews(dto: CreateNewsDto, userId: string) {
    const news = this.newsRepo.create({
      ...dto,
      authorId: userId,
    });
    const saved = await this.newsRepo.save(news);
    return this.getNewsById(saved.id);
  }

  // 4. Yangilikni tahrirlash (Faqat Admin/Moderator)
  async updateNews(id: string, dto: UpdateNewsDto) {
    const news = await this.newsRepo.findOne({ where: { id } });
    if (!news) {
      throw new NotFoundException('Yangilik topilmadi');
    }

    Object.assign(news, dto);
    await this.newsRepo.save(news);
    return this.getNewsById(id);
  }

  // 5. Yangilikni o'chirish (Faqat Admin/Moderator)
  async deleteNews(id: string) {
    const news = await this.newsRepo.findOne({ where: { id } });
    if (!news) {
      throw new NotFoundException('Yangilik topilmadi');
    }

    await this.newsRepo.remove(news);
    return { success: true, message: 'Yangilik muvaffaqiyatli o\'chirildi' };
  }
  // Paginatsiyali barcha yangiliklarni olish
  async getNewsWithPagination(query: NewsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.newsRepo.findAndCount({
      relations: { author: true },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        author: {
          id: true,
          username: true,
          fullName: true,
        },
      },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}