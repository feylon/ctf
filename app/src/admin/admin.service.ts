// src/admin/admin.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, ILike, MoreThanOrEqual, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role, User } from '../entity/user.entity';
import { ChallengeGroup } from 'src/entity/challenge_groups.entity';
import { Challenge } from 'src/entity/challenge.entity';
import { Team } from 'src/entity/team.entity';
import { Submission } from 'src/entity/submissions.entity';
import { TournamentSettings } from 'src/entity/tournament-settings.entity';
import { Problem } from 'src/entity/problem.entity';
import { ProblemSubmission } from 'src/entity/problem-submission.entity';
import { LoginHistory } from 'src/entity/login-history.entity';
import { News } from 'src/entity/news.entity';
import { GetProblemsAdminQueryDto, GetSubmissionsQueryDto, GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { CreateChallengeGroupDto, UpdateChallengeGroupDto } from './dto/challenge-group.dto';
import { CreateChallengeDto, UpdateChallengeDto } from './dto/challenge.dto';
import { AdjustScoreDto } from './dto/adjust-score.dto';
import { UpdateTournamentSettingsDto } from './dto/tournament-settings.dto';
import { CreateProblemDto, UpdateProblemDto } from './dto/create-problem.dto';

const paginate = <T>(data: T[], total: number, page: number, limit: number) => ({
  data,
  meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
});

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(ChallengeGroup) private readonly groupRepo: Repository<ChallengeGroup>,
    @InjectRepository(Challenge) private readonly challengeRepo: Repository<Challenge>,
    @InjectRepository(Team) private readonly teamRepo: Repository<Team>,
    @InjectRepository(Submission) private readonly submissionRepo: Repository<Submission>,
    @InjectRepository(TournamentSettings) private readonly tournamentSettingsRepo: Repository<TournamentSettings>,
    @InjectRepository(Problem) private readonly problemRepo: Repository<Problem>,
    @InjectRepository(ProblemSubmission) private readonly problemSubmissionRepo: Repository<ProblemSubmission>,
    @InjectRepository(LoginHistory) private readonly loginHistoryRepo: Repository<LoginHistory>,
    @InjectRepository(News) private readonly newsRepo: Repository<News>,
    private readonly dataSource: DataSource,
  ) { }

  // ==================== DASHBOARD ====================

  async getStats() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      users, bannedUsers, teams, groups, challenges, problems, news,
      submissions, correctSubmissions, submissions24h, problemSubmissions,
    ] = await Promise.all([
      this.userRepo.count({ where: { isDelete: false } }),
      this.userRepo.count({ where: { isDelete: false, isBanned: true } }),
      this.teamRepo.count(),
      this.groupRepo.count(),
      this.challengeRepo.count(),
      this.problemRepo.count(),
      this.newsRepo.count(),
      this.submissionRepo.count(),
      this.submissionRepo.count({ where: { isCorrect: true } }),
      this.submissionRepo.count({ where: { submittedAt: MoreThanOrEqual(since) } }),
      this.problemSubmissionRepo.count(),
    ]);

    const recentSolves = await this.submissionRepo.find({
      where: { isCorrect: true },
      relations: { user: true, team: true, challenge: true },
      select: {
        id: true,
        submittedAt: true,
        pointsAwarded: true,
        user: { id: true, username: true },
        team: { id: true, name: true },
        challenge: { id: true, title: true },
      },
      order: { submittedAt: 'DESC' },
      take: 10,
    });

    // Kategoriyalar bo'yicha vazifalar soni
    const categories = await this.challengeRepo
      .createQueryBuilder('c')
      .select('c.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.category')
      .orderBy('count', 'DESC')
      .getRawMany<{ category: string; count: string }>();

    return {
      counts: { users, bannedUsers, teams, groups, challenges, problems, news },
      submissions: {
        total: submissions,
        correct: correctSubmissions,
        last24h: submissions24h,
        problemSubmissions,
        successRate: submissions > 0 ? Number(((correctSubmissions / submissions) * 100).toFixed(1)) : 0,
      },
      categories: categories.map((c) => ({ category: c.category, count: Number(c.count) })),
      recentSolves,
    };
  }

  // ==================== FOYDALANUVCHILAR ====================

  async getAllUsers(query: GetUsersQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoin('user.team', 'team')
      .select([
        'user.id', 'user.fullName', 'user.email', 'user.username', 'user.role', 'user.score',
        'user.isActive', 'user.isBanned', 'user.isDelete', 'user.createdAt', 'team.id', 'team.name',
      ]);

    if (query.search) {
      qb.andWhere(
        '(user.fullName ILIKE :search OR user.email ILIKE :search OR user.username ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (query.role) qb.andWhere('user.role = :role', { role: query.role });
    if (query.isBanned !== undefined) qb.andWhere('user.isBanned = :isBanned', { isBanned: query.isBanned });
    if (!query.includeDeleted) qb.andWhere('user.isDelete = false');

    qb.orderBy('user.createdAt', 'DESC').skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async getUserDetail(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: { team: true },
      select: {
        id: true, fullName: true, email: true, username: true, role: true, score: true,
        isActive: true, isBanned: true, isDelete: true, createdAt: true, updatedAt: true,
        team: { id: true, name: true, score: true },
      },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const [loginHistory, submissions, problemsSolved] = await Promise.all([
      this.loginHistoryRepo.find({ where: { user: { id } }, order: { createdAt: 'DESC' }, take: 20 }),
      this.submissionRepo.find({
        where: { user: { id } },
        relations: { challenge: true },
        select: { id: true, isCorrect: true, pointsAwarded: true, submittedAt: true, challenge: { id: true, title: true } },
        order: { submittedAt: 'DESC' },
        take: 20,
      }),
      this.problemSubmissionRepo.count({ where: { user: { id }, isCorrect: true } }),
    ]);

    return { ...user, loginHistory, submissions, problemsSolved };
  }

  private async findUserOrFail(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return user;
  }

  private assertNotSelf(actorId: string, targetId: string, action: string) {
    if (actorId === targetId) {
      throw new BadRequestException(`O'zingizni ${action} mumkin emas`);
    }
  }

  async updateUserStatus(actorId: string, id: string, dto: UpdateUserStatusDto) {
    this.assertNotSelf(actorId, id, 'faolsizlantirish');
    const user = await this.findUserOrFail(id);
    user.isActive = dto.isActive;
    await this.userRepo.save(user);
    return { success: true, message: dto.isActive ? 'Foydalanuvchi faollashtirildi' : 'Foydalanuvchi faolsizlantirildi', isActive: user.isActive };
  }

  async updateUserRole(actorId: string, id: string, dto: UpdateUserRoleDto) {
    this.assertNotSelf(actorId, id, 'rolini o\'zgartirish');
    const user = await this.findUserOrFail(id);
    user.role = dto.role;
    await this.userRepo.save(user);
    return { success: true, message: `Foydalanuvchi roli "${dto.role}" ga o'zgartirildi`, role: user.role };
  }

  async deleteUser(actorId: string, id: string) {
    this.assertNotSelf(actorId, id, 'o\'chirish');
    const user = await this.findUserOrFail(id);

    user.isDelete = true;
    user.isActive = false;
    user.team = null as any; // O'chirilgan foydalanuvchi jamoa joyini band qilmasin
    await this.userRepo.save(user);

    return { message: 'Foydalanuvchi muvaffaqiyatli o\'chirildi (soft delete)' };
  }

  async restoreUser(id: string) {
    const user = await this.findUserOrFail(id);
    user.isDelete = false;
    user.isActive = true;
    await this.userRepo.save(user);
    return { message: 'Foydalanuvchi qayta tiklandi' };
  }

  async toggleUserBan(actorId: string, userId: string) {
    this.assertNotSelf(actorId, userId, 'bloklash');
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: { id: true, username: true, isBanned: true, role: true },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    if (user.role === Role.ADMIN && !user.isBanned) {
      throw new BadRequestException('Administratorni bloklash mumkin emas. Avval rolini o\'zgartiring');
    }

    user.isBanned = !user.isBanned;
    await this.userRepo.save(user);

    return {
      success: true,
      message: `Foydalanuvchi "${user.username}" ${user.isBanned ? 'bloklandi (banned)' : 'blokdan chiqarildi (unbanned)'}`,
      isBanned: user.isBanned,
    };
  }

  // ==================== CHALLENGE GURUHLARI ====================

  async createGroup(dto: CreateChallengeGroupDto) {
    const group = this.groupRepo.create({ name: dto.name.trim() });
    return await this.groupRepo.save(group);
  }

  async getAllGroups() {
    const groups = await this.groupRepo.find({
      relations: { challenges: true, teams: true },
      select: {
        id: true,
        name: true,
        challenges: { id: true, title: true, category: true, points: true },
        teams: { id: true, name: true },
      },
      order: { name: 'ASC' },
    });
    return groups.map((g) => ({ ...g, teamCount: g.teams.length }));
  }

  async updateGroup(id: string, dto: UpdateChallengeGroupDto) {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Challenge guruhi topilmadi');

    group.name = dto.name.trim();
    return await this.groupRepo.save(group);
  }

  async deleteGroup(id: string) {
    const group = await this.groupRepo.findOne({ where: { id }, relations: { challenges: true, teams: true } });
    if (!group) throw new NotFoundException('Challenge guruhi topilmadi');

    if (group.challenges.length > 0) {
      throw new BadRequestException(
        `Guruhda ${group.challenges.length} ta vazifa bor. Avval vazifalarni o'chiring yoki boshqa guruhga o'tkazing`,
      );
    }

    // Jamoalar bilan bog'lanishni tozalab, keyin o'chiramiz
    group.teams = [];
    await this.groupRepo.save(group);
    await this.groupRepo.delete(id);
    return { message: 'Challenge guruhi muvaffaqiyatli o\'chirildi' };
  }

  // ==================== CHALLENGE'LAR ====================

  private async findGroupOrFail(groupId: string) {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Challenge guruhi topilmadi');
    return group;
  }

  private assertTimeRange(start?: Date | null, end?: Date | null) {
    if (start && end && start >= end) {
      throw new BadRequestException('Tugash vaqti boshlanish vaqtidan keyin bo\'lishi kerak');
    }
  }

  async createChallenge(dto: CreateChallengeDto) {
    const group = await this.findGroupOrFail(dto.groupId);

    if (dto.minPoints > dto.points) {
      throw new BadRequestException('Minimal ball boshlang\'ich balldan katta bo\'lishi mumkin emas');
    }

    const startTime = dto.startTime ? new Date(dto.startTime) : null;
    const endTime = dto.endTime ? new Date(dto.endTime) : null;
    this.assertTimeRange(startTime, endTime);

    const challenge = this.challengeRepo.create({
      title: dto.title.trim(),
      description: dto.description,
      flagHash: await bcrypt.hash(dto.flag.trim(), 10),
      points: dto.points,
      initialPoints: dto.points,
      minPoints: dto.minPoints,
      decrementStep: dto.decrementStep,
      category: dto.category.trim(),
      attachmentPath: dto.attachmentPath || (null as any),
      startTime: startTime as any,
      endTime: endTime as any,
      allowedIpRange: dto.allowedIpRange?.trim() || '*',
      group,
    });

    const saved = await this.challengeRepo.save(challenge);
    return this.getChallenge(saved.id);
  }

  async getAllChallenges() {
    const challenges = await this.challengeRepo.find({
      relations: { group: true },
      order: { createdAt: 'DESC' },
    });

    const stats = await this.submissionRepo
      .createQueryBuilder('s')
      .select('"s"."challengeId"', 'challengeId')
      .addSelect('COUNT(*) FILTER (WHERE s.pointsAwarded > 0)', 'solves')
      .addSelect('COUNT(*)', 'attempts')
      .groupBy('"s"."challengeId"')
      .getRawMany<{ challengeId: string; solves: string; attempts: string }>();
    const statsMap = new Map(stats.map((s) => [s.challengeId, s]));

    return challenges.map((c) => ({
      ...c,
      solves: Number(statsMap.get(c.id)?.solves ?? 0),
      attempts: Number(statsMap.get(c.id)?.attempts ?? 0),
    }));
  }

  async getChallenge(id: string) {
    const challenge = await this.challengeRepo.findOne({ where: { id }, relations: { group: true } });
    if (!challenge) throw new NotFoundException('Challenge topilmadi');
    return challenge;
  }

  async updateChallenge(id: string, dto: UpdateChallengeDto) {
    const challenge = await this.getChallenge(id);

    if (dto.groupId !== undefined) challenge.group = await this.findGroupOrFail(dto.groupId);
    if (dto.title !== undefined) challenge.title = dto.title.trim();
    if (dto.description !== undefined) challenge.description = dto.description;
    if (dto.category !== undefined) challenge.category = dto.category.trim();
    if (dto.attachmentPath !== undefined) challenge.attachmentPath = (dto.attachmentPath || null) as any;
    if (dto.startTime !== undefined) challenge.startTime = (dto.startTime ? new Date(dto.startTime) : null) as any;
    if (dto.endTime !== undefined) challenge.endTime = (dto.endTime ? new Date(dto.endTime) : null) as any;
    if (dto.allowedIpRange !== undefined) challenge.allowedIpRange = dto.allowedIpRange.trim() || '*';
    if (dto.decrementStep !== undefined) challenge.decrementStep = dto.decrementStep;
    if (dto.minPoints !== undefined) challenge.minPoints = dto.minPoints;
    if (dto.points !== undefined) {
      // Admin ballni qo'lda o'zgartirsa, joriy qiymat ham boshlang'ich qiymat ham yangilanadi
      challenge.points = dto.points;
      challenge.initialPoints = dto.points;
    }
    if (challenge.minPoints > challenge.initialPoints) {
      throw new BadRequestException('Minimal ball boshlang\'ich balldan katta bo\'lishi mumkin emas');
    }
    this.assertTimeRange(challenge.startTime, challenge.endTime);

    if (dto.flag !== undefined) {
      await this.challengeRepo.update({ id }, { flagHash: await bcrypt.hash(dto.flag.trim(), 10) });
    }

    await this.challengeRepo.save(challenge);
    return this.getChallenge(id);
  }

  async deleteChallenge(id: string) {
    await this.getChallenge(id);

    await this.dataSource.transaction(async (manager) => {
      // Jamoalarga berilgan ballarni qaytarib olamiz
      const awarded = await manager
        .createQueryBuilder(Submission, 's')
        .select('"s"."teamId"', 'teamId')
        .addSelect('SUM(s.pointsAwarded)', 'points')
        .where('"s"."challengeId" = :id AND s.pointsAwarded > 0', { id })
        .groupBy('"s"."teamId"')
        .getRawMany<{ teamId: string; points: string }>();

      for (const row of awarded) {
        if (row.teamId) {
          await manager.decrement(Team, { id: row.teamId }, 'score', Number(row.points));
        }
      }

      await manager.delete(Submission, { challenge: { id } });
      await manager.delete(Challenge, { id });
    });

    return { message: 'Challenge va unga tegishli yechimlar o\'chirildi, jamoa ballari qayta hisoblandi' };
  }

  // ==================== JAMOALAR ====================

  async getAllTeams() {
    const teams = await this.teamRepo.find({
      relations: { members: true, captain: true, challengeGroups: true },
      select: {
        id: true,
        name: true,
        score: true,
        isBanned: true,
        inviteCode: true,
        createdAt: true,
        members: { id: true, username: true, fullName: true },
        captain: { id: true, username: true },
        challengeGroups: { id: true, name: true },
      },
      order: { score: 'DESC' }, // Ballari bo'yicha reyting tartibida
    });

    const solves = await this.submissionRepo
      .createQueryBuilder('s')
      .select('"s"."teamId"', 'teamId')
      .addSelect('COUNT(*)', 'solves')
      .where('s.pointsAwarded > 0')
      .groupBy('"s"."teamId"')
      .getRawMany<{ teamId: string; solves: string }>();
    const solvesMap = new Map(solves.map((s) => [s.teamId, Number(s.solves)]));

    return teams.map((t) => ({ ...t, solves: solvesMap.get(t.id) ?? 0 }));
  }

  async deleteTeam(id: string) {
    const team = await this.teamRepo.findOne({ where: { id } });
    if (!team) throw new NotFoundException('Jamoa topilmadi');

    await this.dataSource.transaction(async (manager) => {
      // A'zolarni bo'shatamiz; submissions ON DELETE CASCADE orqali o'chadi
      await manager.update(User, { team: { id } }, { team: null as any });
      await manager.delete(Team, { id });
    });

    return { message: 'Jamoa muvaffaqiyatli o\'chirildi va a\'zolari bo\'shatildi' };
  }

  async adjustTeamScore(teamId: string, dto: AdjustScoreDto) {
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      select: { id: true, name: true, score: true },
    });
    if (!team) throw new NotFoundException('Jamoa topilmadi');

    // Ball 0 dan pastga tushmaydi
    team.score = Math.max(0, team.score + dto.points);
    await this.teamRepo.save(team);

    return {
      success: true,
      message: `"${team.name}" jamoasining balli o'zgartirildi. Joriy ball: ${team.score}`,
      team: { id: team.id, name: team.name, newScore: team.score, reason: dto.reason },
    };
  }

  async toggleTeamBan(teamId: string) {
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      select: { id: true, name: true, isBanned: true },
    });
    if (!team) throw new NotFoundException('Jamoa topilmadi');

    team.isBanned = !team.isBanned;
    await this.teamRepo.save(team);

    return {
      success: true,
      message: `"${team.name}" jamoasi ${team.isBanned ? 'bloklandi (banned)' : 'blokdan chiqarildi (unbanned)'}`,
      isBanned: team.isBanned,
    };
  }

  // ==================== YECHIMLAR ====================

  async getAllSubmissions(query: GetSubmissionsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    // TypeORM 1.x da where ichidagi undefined qiymatlar xato beradi, shuning uchun faqat berilganlarini qo'shamiz
    const where: FindOptionsWhere<Submission> = {};
    if (query.challengeId) where.challenge = { id: query.challengeId };
    if (query.teamId) where.team = { id: query.teamId };
    if (query.isCorrect !== undefined) where.isCorrect = query.isCorrect;

    const [data, total] = await this.submissionRepo.findAndCount({
      where,
      select: {
        id: true,
        isCorrect: true,
        pointsAwarded: true,
        submittedAt: true,
        user: { id: true, username: true },
        team: { id: true, name: true },
        challenge: { id: true, title: true, points: true },
      },
      relations: { user: true, team: true, challenge: true },
      order: { submittedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(data, total, page, limit);
  }

  // ==================== MUSOBAQA SOZLAMALARI ====================

  async getTournamentSettings() {
    let settings = await this.tournamentSettingsRepo.findOne({ where: {}, order: { updatedAt: 'DESC' } });
    if (!settings) {
      settings = await this.tournamentSettingsRepo.save(this.tournamentSettingsRepo.create({ isLive: true }));
    }
    return settings;
  }

  async updateTournamentSettings(dto: UpdateTournamentSettingsDto) {
    const settings = await this.getTournamentSettings();

    if (dto.isLive !== undefined) settings.isLive = dto.isLive;
    if (dto.globalStartTime !== undefined) {
      settings.globalStartTime = (dto.globalStartTime ? new Date(dto.globalStartTime) : null) as any;
    }
    if (dto.globalEndTime !== undefined) {
      settings.globalEndTime = (dto.globalEndTime ? new Date(dto.globalEndTime) : null) as any;
    }
    this.assertTimeRange(settings.globalStartTime, settings.globalEndTime);

    await this.tournamentSettingsRepo.save(settings);

    return {
      success: true,
      message: 'Musobaqa sozlamalari muvaffaqiyatli yangilandi',
      settings,
    };
  }

  // ==================== MASALALAR (PROBLEMS) ====================

  async getAllProblems(query: GetProblemsAdminQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const where = query.search
      ? [{ title: ILike(`%${query.search}%`) }, { code: ILike(`%${query.search}%`) }]
      : {};

    const [data, total] = await this.problemRepo.findAndCount({
      where,
      order: { code: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
  }

  async getProblem(id: string) {
    const problem = await this.problemRepo.findOne({ where: { id } });
    if (!problem) throw new NotFoundException('Masala topilmadi');
    return problem;
  }

  async createProblem(dto: CreateProblemDto) {
    const code = dto.code.trim().toUpperCase();
    if (await this.problemRepo.exists({ where: { code } })) {
      throw new BadRequestException('Bu tartib raqam (code) bilan masala allaqachon mavjud!');
    }

    const problem = this.problemRepo.create({
      code,
      title: dto.title.trim(),
      description: dto.description,
      flagHash: await bcrypt.hash(dto.flag.trim(), 10),
      difficulty: dto.difficulty,
      category: dto.category.trim(),
      points: dto.points,
    });

    const saved = await this.problemRepo.save(problem);
    return this.getProblem(saved.id);
  }

  async updateProblem(id: string, dto: UpdateProblemDto) {
    const problem = await this.getProblem(id);

    if (dto.code !== undefined) {
      const code = dto.code.trim().toUpperCase();
      if (code !== problem.code && (await this.problemRepo.exists({ where: { code } }))) {
        throw new BadRequestException('Bu tartib raqam (code) bilan masala allaqachon mavjud!');
      }
      problem.code = code;
    }
    if (dto.title !== undefined) problem.title = dto.title.trim();
    if (dto.description !== undefined) problem.description = dto.description;
    if (dto.difficulty !== undefined) problem.difficulty = dto.difficulty;
    if (dto.category !== undefined) problem.category = dto.category.trim();
    if (dto.points !== undefined) problem.points = dto.points;

    await this.problemRepo.save(problem);
    if (dto.flag !== undefined) {
      await this.problemRepo.update({ id }, { flagHash: await bcrypt.hash(dto.flag.trim(), 10) });
    }

    return this.getProblem(id);
  }

  async deleteProblem(id: string) {
    await this.getProblem(id);

    await this.dataSource.transaction(async (manager) => {
      // Foydalanuvchilarga berilgan ballarni qaytarib olamiz
      const problem = await manager.findOneByOrFail(Problem, { id });
      const solvers = await manager
        .createQueryBuilder(ProblemSubmission, 'ps')
        .select('DISTINCT "ps"."userId"', 'userId')
        .where('"ps"."problemId" = :id AND ps.isCorrect = true', { id })
        .getRawMany<{ userId: string }>();

      for (const { userId } of solvers) {
        await manager
          .createQueryBuilder()
          .update(User)
          .set({ score: () => `GREATEST(score - ${Number(problem.points)}, 0)` })
          .where('id = :userId', { userId })
          .execute();
      }

      // Masalani o'chirish (Cascade tufayli uning submission'lari ham o'chib ketadi)
      await manager.delete(Problem, { id });
    });

    return {
      success: true,
      message: 'Masala va unga bog\'liq barcha ma\'lumotlar muvaffaqiyatli o\'chirildi.',
    };
  }
}
