import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike } from 'typeorm';
import { Problem } from '../entity/problem.entity';
import { ProblemSubmission } from '../entity/problem-submission.entity';
import { User } from '../entity/user.entity';
import { ProblemQueryDto } from './dto/problem-query.dto';
import * as bcrypt from 'bcrypt';
import { SubmitProblemDto } from './dto/submit-problem.dto';

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


     async getProblemDetail(id: string, userId?: string) {
    // flagHash bazadan tanlab olinmasligi uchun select qilmaymiz
    const problem = await this.problemRepo.findOne({
      where: { id },
      select: {
  id: true,
  code: true,
  title: true,
  description: true,
  difficulty: true,
  category: true,
  rating: true,
  points: true,
  solvedCount: true,
  totalTries: true,
},
    });

    if (!problem) {
      throw new NotFoundException('Masala topilmadi');
    }

    // Foydalanuvchi bu masalani yechganmi yoki yo'qmi
    let isSolved = false;
    if (userId) {
      isSolved = await this.submissionRepo.exists({
        where: { user: { id: userId }, problem: { id }, isCorrect: true },
      });
    }

    const successRate = problem.totalTries > 0 
      ? Number(((problem.solvedCount / problem.totalTries) * 100).toFixed(1)) 
      : 0;

    return {
      ...problem,
      successRate,
      isSolved,
    };
  }

  // 2. Masalaga javob yuborish va tekshirish
  async submitProblem(userId: string, problemId: string, dto: SubmitProblemDto) {
    // flagHash ni olish uchun maxsus select qilamiz (chunki entity'da select: false qilingan bo'lishi mumkin)
    const problem = await this.problemRepo.createQueryBuilder('problem')
      .addSelect('problem.flagHash')
      .where('problem.id = :id', { id: problemId })
      .getOne();

    if (!problem) {
      throw new NotFoundException('Masala topilmadi');
    }

    // Foydalanuvchi bu masalani allaqachon to'g'ri yechganligini tekshirish
    const alreadySolved = await this.submissionRepo.findOne({
      where: { user: { id: userId }, problem: { id: problemId }, isCorrect: true },
    });

    if (alreadySolved) {
      throw new BadRequestException('Siz bu masalani allaqachon muvaffaqiyatli yechgansiz.');
    }

    // Javobni (flag) solishtirish
    const isCorrect = await bcrypt.compare(dto.flag, problem.flagHash);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Urinishni (Submission) saqlash
      const submission = queryRunner.manager.create(ProblemSubmission, {
        user: { id: userId },
        problem: { id: problemId },
        isCorrect,
        status: isCorrect ? 'Accepted' : 'Wrong Answer',
        submittedAnswer: dto.flag, // Agar entity'ga submittedAnswer qo'shgan bo'lsangiz
      });
      await queryRunner.manager.save(submission);

      // Masalaning umumiy statistikasini yangilash
      problem.totalTries += 1;
      if (isCorrect) {
        problem.solvedCount += 1;
        // User score ga ball qo'shish (faqat birinchi marta to'g'ri yechganda)
        await queryRunner.manager.increment(User, { id: userId }, 'score', problem.points);
      }
      await queryRunner.manager.save(problem);

      await queryRunner.commitTransaction();

      if (isCorrect) {
        return {
          success: true,
          message: `Tabriklaymiz! To'g'ri javob. Sizga ${problem.points} ball qo'shildi.`,
        };
      } else {
        return {
          success: false,
          message: 'Noto\'g\'ri javob. Qaytadan urinib ko\'ring.',
        };
      }

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Javobni tekshirish vaqtida xatolik yuz berdi.');
    } finally {
      await queryRunner.release();
    }
  }
}