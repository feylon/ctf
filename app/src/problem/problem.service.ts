import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike } from 'typeorm';
import { Problem } from '../entity/problem.entity';
import { ProblemSubmission } from '../entity/problem-submission.entity';
import { User } from '../entity/user.entity';
import { ProblemQueryDto } from './dto/problem-query.dto';

@Injectable()
export class ProblemService {
    constructor(
        @InjectRepository(Problem) private readonly problemRepo: Repository<Problem>,
        @InjectRepository(ProblemSubmission) private readonly submissionRepo: Repository<ProblemSubmission>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        private dataSource: DataSource,
    ) { }

    // Paginatsiya, qidiruv va filtrlash orqali barcha masalalarni olish
    async getProblemsWithPagination(query: ProblemQueryDto, userId?: string) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;

        // Qidiruv va filtrlash shartlarini shakllantirish
        const whereCondition: any = {};

        if (query.search) {
            // Kod yoki Sarlavha bo'yicha qidirish
            whereCondition.title = ILike(`%${query.search}%`);
        }

        if (query.category) {
            whereCondition.category = query.category;
        }

        const [problems, total] = await this.problemRepo.findAndCount({
            where: whereCondition,
            select: {
                id: true,
                code: true,
                title: true,
                difficulty: true,
                category: true,
                rating: true,
                points: true,
                solvedCount: true,
                totalTries: true,
            }
            ,
            order: { code: 'ASC' },
            skip,
            take: limit,
        });

        // Agar foydalanuvchi login qilgan bo'lsa, qaysi masalalarni yechganini aniqlaymiz
        let solvedProblemIds = new Set<string>();
        if (userId) {
            const solvedSubmissions = await this.submissionRepo.find({
                where: { user: { id: userId }, isCorrect: true },
                relations: { problem: true },
                select: { id: true, problem: true },
            });
            solvedProblemIds = new Set(solvedSubmissions.map(sub => sub.problem.id));
        }

        const data = problems.map(problem => {
            const successRate = problem.totalTries > 0
                ? Number(((problem.solvedCount / problem.totalTries) * 100).toFixed(1))
                : 0;

            return {
                ...problem,
                successRate,
                isSolved: userId ? solvedProblemIds.has(problem.id) : false,
            };
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