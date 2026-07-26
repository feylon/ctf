import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Problem } from '../entity/problem.entity';
import { ProblemSubmission } from '../entity/problem-submission.entity';
import { User } from '../entity/user.entity';
import { ProblemQueryDto } from './dto/problem-query.dto';
import { SubmitProblemDto } from './dto/submit-problem.dto';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';

const successRateOf = (problem: Pick<Problem, 'solvedCount' | 'totalTries'>) =>
    problem.totalTries > 0 ? Number(((problem.solvedCount / problem.totalTries) * 100).toFixed(1)) : 0;

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

        const qb = this.problemRepo
            .createQueryBuilder('p')
            .select([
                'p.id', 'p.code', 'p.title', 'p.difficulty', 'p.category',
                'p.rating', 'p.points', 'p.solvedCount', 'p.totalTries',
            ]);

        if (query.search) {
            // Kod yoki sarlavha bo'yicha qidirish
            qb.andWhere(new Brackets((w) => {
                w.where('p.title ILIKE :search', { search: `%${query.search}%` })
                    .orWhere('p.code ILIKE :search', { search: `%${query.search}%` });
            }));
        }
        if (query.category) {
            qb.andWhere('p.category = :category', { category: query.category });
        }

        const sortMap = {
            code: 'p.code',
            difficulty: 'p.difficulty',
            points: 'p.points',
            solved: 'p.solvedCount',
        } as const;
        qb.orderBy(sortMap[query.sort ?? 'code'], query.order ?? 'ASC')
            .addOrderBy('p.code', 'ASC')
            .skip((page - 1) * limit)
            .take(limit);

        const [problems, total] = await qb.getManyAndCount();

        // Agar foydalanuvchi login qilgan bo'lsa, qaysi masalalarni yechganini aniqlaymiz
        let solvedProblemIds = new Set<string>();
        let attemptedProblemIds = new Set<string>();
        if (userId && problems.length > 0) {
            const rows = await this.submissionRepo
                .createQueryBuilder('ps')
                .select('"ps"."problemId"', 'problemId')
                .addSelect('BOOL_OR(ps.isCorrect)', 'solved')
                .where('"ps"."userId" = :userId', { userId })
                .andWhere('"ps"."problemId" IN (:...ids)', { ids: problems.map((p) => p.id) })
                .groupBy('"ps"."problemId"')
                .getRawMany<{ problemId: string; solved: boolean }>();
            solvedProblemIds = new Set(rows.filter((r) => r.solved).map((r) => r.problemId));
            attemptedProblemIds = new Set(rows.map((r) => r.problemId));
        }

        const data = problems.map((problem) => ({
            ...problem,
            successRate: successRateOf(problem),
            isSolved: solvedProblemIds.has(problem.id),
            isAttempted: attemptedProblemIds.has(problem.id),
        }));

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

    async getCategories() {
        const rows = await this.problemRepo
            .createQueryBuilder('p')
            .select('p.category', 'category')
            .addSelect('COUNT(*)', 'count')
            .groupBy('p.category')
            .orderBy('p.category', 'ASC')
            .getRawMany<{ category: string; count: string }>();
        return rows.map((r) => ({ category: r.category, count: Number(r.count) }));
    }

    async getProblemDetail(id: string, userId?: string) {
        // flagHash entity'da select: false, shuning uchun javobga tushmaydi
        const problem = await this.problemRepo.findOne({ where: { id } });

        if (!problem) {
            throw new NotFoundException('Masala topilmadi');
        }

        let isSolved = false;
        let myAttempts = 0;
        if (userId) {
            [isSolved, myAttempts] = await Promise.all([
                this.submissionRepo.exists({ where: { user: { id: userId }, problem: { id }, isCorrect: true } }),
                this.submissionRepo.count({ where: { user: { id: userId }, problem: { id } } }),
            ]);
        }

        return {
            ...problem,
            successRate: successRateOf(problem),
            isSolved,
            myAttempts,
        };
    }

    async getMySubmissions(userId: string, problemId: string) {
        return await this.submissionRepo.find({
            where: { user: { id: userId }, problem: { id: problemId } },
            select: { id: true, status: true, isCorrect: true, submittedAt: true },
            order: { submittedAt: 'DESC' },
            take: 20,
        });
    }

    // Masalaga javob yuborish va tekshirish
    async submitProblem(userId: string, problemId: string, dto: SubmitProblemDto) {
        const problem = await this.problemRepo
            .createQueryBuilder('problem')
            .addSelect('problem.flagHash')
            .where('problem.id = :id', { id: problemId })
            .getOne();

        if (!problem) {
            throw new NotFoundException('Masala topilmadi');
        }
        if (!problem.flagHash) {
            throw new BadRequestException('Bu masala uchun javob hali kiritilmagan');
        }

        const user = await this.userRepo.findOne({ where: { id: userId }, select: { id: true, isBanned: true } });
        if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
        if (user.isBanned) throw new ForbiddenException('Sizning profilingiz bloklangan!');

        const answer = dto.flag.trim();
        // bcrypt sekin ishlaydi, shuning uchun tranzaksiyadan tashqarida tekshiramiz
        const isCorrect = await bcrypt.compare(answer, problem.flagHash);

        return await this.dataSource.transaction(async (manager) => {
            // Bitta foydalanuvchining parallel yuborishlari ketma-ket bajarilishi uchun
            await manager
                .createQueryBuilder(User, 'u')
                .setLock('pessimistic_write')
                .where('u.id = :userId', { userId })
                .getOne();

            const alreadySolved = await manager.exists(ProblemSubmission, {
                where: { user: { id: userId }, problem: { id: problemId }, isCorrect: true },
            });
            if (alreadySolved) {
                throw new BadRequestException('Siz bu masalani allaqachon muvaffaqiyatli yechgansiz.');
            }

            await manager.save(manager.create(ProblemSubmission, {
                user: { id: userId },
                problem: { id: problemId },
                isCorrect,
                status: isCorrect ? 'Accepted' : 'Wrong Answer',
                // To'g'ri javob bazada ochiq saqlanmaydi
                submittedAnswer: isCorrect ? null : answer.slice(0, 255),
            } as Partial<ProblemSubmission>));

            // Statistika atomar yangilanadi (parallel so'rovlarda qiymat yo'qolmasligi uchun)
            await manager.increment(Problem, { id: problemId }, 'totalTries', 1);
            if (isCorrect) {
                await manager.increment(Problem, { id: problemId }, 'solvedCount', 1);
                await manager.increment(User, { id: userId }, 'score', problem.points);
            }

            return isCorrect
                ? { success: true, pointsAwarded: problem.points, message: `Tabriklaymiz! To'g'ri javob. Sizga ${problem.points} ball qo'shildi.` }
                : { success: false, message: 'Noto\'g\'ri javob. Qaytadan urinib ko\'ring.' };
        });
    }

    // Masalalar bo'yicha foydalanuvchilar reytingi
    async getLeaderboard(query: LeaderboardQueryDto) {
        const page = query.page || 1;
        const limit = query.limit || 50;

        const qb = this.userRepo
            .createQueryBuilder('u')
            .select(['u.id', 'u.username', 'u.fullName', 'u.score'])
            .addSelect(
                (sq) => sq
                    .select('COUNT(*)')
                    .from(ProblemSubmission, 'ps')
                    .where('"ps"."userId" = "u"."id" AND ps.isCorrect = true'),
                'solved',
            )
            .where('u.isDelete = false AND u.isBanned = false AND u.score > 0')
            .orderBy('u.score', 'DESC')
            .addOrderBy('u.createdAt', 'ASC')
            .offset((page - 1) * limit)
            .limit(limit);

        const [{ entities, raw }, total] = await Promise.all([
            qb.getRawAndEntities<{ solved: string }>(),
            qb.getCount(),
        ]);

        return {
            data: entities.map((u, i) => ({
                rank: (page - 1) * limit + i + 1,
                id: u.id,
                username: u.username,
                fullName: u.fullName,
                score: u.score,
                solved: Number(raw[i]?.solved ?? 0),
            })),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
}
