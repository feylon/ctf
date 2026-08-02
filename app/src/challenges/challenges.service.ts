// src/challenges/challenges.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Challenge } from '../entity/challenge.entity';
import { Submission } from '../entity/submissions.entity';
import { User } from '../entity/user.entity';
import { Team } from '../entity/team.entity';
import { ChallengeGroup } from '../entity/challenge_groups.entity';
import { TournamentSettings } from '../entity/tournament-settings.entity';
import { isIpAllowed } from '../common/helpers/ip-range.helper';

export type TournamentState = 'running' | 'paused' | 'not_started' | 'finished';

@Injectable()
export class ChallengesService {
  private readonly maxTeamSize: number;

  constructor(
    @InjectRepository(Challenge) private readonly challengeRepo: Repository<Challenge>,
    @InjectRepository(Submission) private readonly submissionRepo: Repository<Submission>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Team) private readonly teamRepo: Repository<Team>,
    @InjectRepository(ChallengeGroup) private readonly challengeGroupRepo: Repository<ChallengeGroup>,
    @InjectRepository(TournamentSettings) private readonly tournamentSettingsRepo: Repository<TournamentSettings>,
    private readonly dataSource: DataSource,
    config: ConfigService,
  ) {
    this.maxTeamSize = Number(config.get('TEAM_MAX_SIZE', 3));
  }

  // ==================== YORDAMCHI METODLAR ====================

  private generateInviteCode() {
    return randomBytes(5).toString('hex').toUpperCase();
  }

  private async getUserTeamId(userId: string, manager: EntityManager = this.dataSource.manager) {
    const user = await manager.findOne(User, {
      where: { id: userId },
      relations: { team: true },
      select: { id: true, team: { id: true } },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return user.team?.id ?? null;
  }

  private async requireTeamId(userId: string) {
    const teamId = await this.getUserTeamId(userId);
    if (!teamId) {
      throw new BadRequestException('Siz hali hech qanday jamoada emassiz');
    }
    return teamId;
  }

  private async getSettings() {
    return await this.tournamentSettingsRepo.findOne({ where: {}, order: { updatedAt: 'DESC' } });
  }

  // ==================== MUSOBAQA HOLATI ====================

  async getTournamentStatus() {
    const settings = await this.getSettings();
    const now = new Date();

    let state: TournamentState = 'running';
    if (settings) {
      if (settings.globalStartTime && now < settings.globalStartTime) state = 'not_started';
      else if (settings.globalEndTime && now > settings.globalEndTime) state = 'finished';
      else if (!settings.isLive) state = 'paused';
    }

    return {
      state,
      isLive: settings?.isLive ?? true,
      globalStartTime: settings?.globalStartTime ?? null,
      globalEndTime: settings?.globalEndTime ?? null,
      maxTeamSize: this.maxTeamSize,
      serverTime: now,
    };
  }

  private async assertTournamentRunning() {
    const { state } = await this.getTournamentStatus();
    if (state === 'paused') throw new ForbiddenException('Musobaqa vaqtincha to‘xtatilgan!');
    if (state === 'not_started') throw new BadRequestException('Musobaqa hali boshlanmagan!');
    if (state === 'finished') throw new BadRequestException('Musobaqa vaqti tugagan!');
  }

  // ==================== JAMOALAR ====================

  async createTeam(userId: string, teamName: string) {
    const name = teamName.trim();

    return await this.dataSource.transaction(async (manager) => {
      if (await this.getUserTeamId(userId, manager)) {
        throw new BadRequestException('Siz allaqachon boshqa jamoadasiz');
      }

      const existingTeam = await manager
        .createQueryBuilder(Team, 'team')
        .where('LOWER(team.name) = LOWER(:name)', { name })
        .getExists();
      if (existingTeam) throw new BadRequestException('Bu nomdagi jamoa allaqachon mavjud');

      const team = manager.create(Team, {
        name,
        inviteCode: this.generateInviteCode(),
        captainId: userId,
      });
      await manager.save(team);
      await manager.update(User, { id: userId }, { team: { id: team.id } });

      return {
        message: 'Jamoa muvaffaqiyatli yaratildi',
        team: { id: team.id, name: team.name, inviteCode: team.inviteCode },
      };
    });
  }

  async joinTeam(userId: string, inviteCode: string) {
    return await this.dataSource.transaction(async (manager) => {
      if (await this.getUserTeamId(userId, manager)) {
        throw new BadRequestException('Siz allaqachon jamoadasiz');
      }

      // Bir vaqtda bir nechta odam qo'shilib, limitdan oshib ketmasligi uchun qatorni qulflaymiz
      const team = await manager
        .createQueryBuilder(Team, 'team')
        .setLock('pessimistic_write')
        .where('team.inviteCode = :code', { code: inviteCode.trim().toUpperCase() })
        .getOne();
      if (!team) throw new NotFoundException('Taklif kodi noto‘g‘ri yoki jamoa topilmadi');
      if (team.isBanned) throw new ForbiddenException('Bu jamoa bloklangan');

      const membersCount = await manager.count(User, { where: { team: { id: team.id } } });
      if (membersCount >= this.maxTeamSize) {
        throw new BadRequestException(
          `Bu jamoa to‘la (maksimal ${this.maxTeamSize} ta ishtirokchi ruxsat etilgan)`,
        );
      }

      await manager.update(User, { id: userId }, { team: { id: team.id } });
      if (!team.captainId) {
        await manager.update(Team, { id: team.id }, { captainId: userId });
      }

      return { message: 'Jamoaga muvaffaqiyatli qo‘shildingiz', team: { id: team.id, name: team.name } };
    });
  }

  async leaveTeam(userId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const teamId = await this.getUserTeamId(userId, manager);
      if (!teamId) throw new BadRequestException('Siz hali hech qanday jamoada emassiz');

      const team = await manager
        .createQueryBuilder(Team, 'team')
        .setLock('pessimistic_write')
        .where('team.id = :teamId', { teamId })
        .getOneOrFail();

      await manager.update(User, { id: userId }, { team: null as any });

      const remaining = await manager.find(User, {
        where: { team: { id: teamId } },
        select: { id: true, createdAt: true },
        order: { createdAt: 'ASC' },
      });

      if (remaining.length === 0) {
        // Hech narsa yechmagan bo'sh jamoa o'chiriladi, aks holda tarix uchun saqlanadi
        const hasSubmissions = await manager.exists(Submission, { where: { team: { id: teamId } } });
        if (!hasSubmissions && team.score === 0) {
          await manager.delete(Team, { id: teamId });
          return { message: 'Jamoadan chiqdingiz. Jamoa bo‘sh qolgani uchun o‘chirildi' };
        }
        await manager.update(Team, { id: teamId }, { captainId: null });
      } else if (team.captainId === userId) {
        // Sardorlik keyingi a'zoga o'tadi
        await manager.update(Team, { id: teamId }, { captainId: remaining[0].id });
      }

      return { message: 'Jamoadan chiqdingiz' };
    });
  }

  async kickMember(captainId: string, memberId: string) {
    if (captainId === memberId) {
      throw new BadRequestException('O‘zingizni chiqarish uchun "jamoadan chiqish" dan foydalaning');
    }

    const teamId = await this.requireTeamId(captainId);
    const team = await this.teamRepo.findOne({ where: { id: teamId }, select: { id: true, captainId: true } });
    if (team?.captainId !== captainId) {
      throw new ForbiddenException('Faqat jamoa sardori a‘zolarni chiqara oladi');
    }

    const member = await this.userRepo.findOne({
      where: { id: memberId, team: { id: teamId } },
      select: { id: true, username: true },
    });
    if (!member) throw new NotFoundException('Bu foydalanuvchi jamoangiz a‘zosi emas');

    await this.userRepo.update({ id: memberId }, { team: null as any });
    return { message: `"${member.username}" jamoadan chiqarildi` };
  }

  async regenerateInviteCode(userId: string) {
    const teamId = await this.requireTeamId(userId);
    const team = await this.teamRepo.findOne({ where: { id: teamId }, select: { id: true, captainId: true } });
    if (team?.captainId !== userId) {
      throw new ForbiddenException('Faqat jamoa sardori taklif kodini yangilay oladi');
    }

    const inviteCode = this.generateInviteCode();
    await this.teamRepo.update({ id: teamId }, { inviteCode });
    return { message: 'Taklif kodi yangilandi', inviteCode };
  }

  async getMyTeam(userId: string) {
    const teamId = await this.getUserTeamId(userId);
    if (!teamId) {
      throw new NotFoundException('Siz hali hech qanday jamoada emassiz');
    }

    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      relations: { members: true, challengeGroups: true },
      select: {
        id: true,
        name: true,
        score: true,
        isBanned: true,
        inviteCode: true,
        captainId: true,
        createdAt: true,
        members: { id: true, username: true, fullName: true },
        challengeGroups: { id: true, name: true },
      },
    });
    if (!team) throw new NotFoundException('Jamoa topilmadi');

    const solves = await this.submissionRepo.find({
      where: { team: { id: teamId }, isCorrect: true },
      relations: { challenge: true, user: true },
      select: {
        id: true,
        pointsAwarded: true,
        submittedAt: true,
        challenge: { id: true, title: true, category: true },
        user: { id: true, username: true },
      },
      order: { submittedAt: 'DESC' },
    });

    return {
      ...team,
      maxTeamSize: this.maxTeamSize,
      isCaptain: team.captainId === userId,
      // Faqat ball olib kelgan (birinchi) to'g'ri yechimlar
      solves: solves.filter((s) => s.pointsAwarded > 0),
    };
  }

  // ==================== CHALLENGE GURUHLARI ====================

  async getGroupsForUser(userId: string) {
    const teamId = await this.getUserTeamId(userId);

    const groups = await this.challengeGroupRepo
      .createQueryBuilder('g')
      .select('g.id', 'id')
      .addSelect('g.name', 'name')
      .addSelect((sq) => sq.select('COUNT(*)').from(Challenge, 'c').where('"c"."groupId" = "g"."id"'), 'challengeCount')
      .addSelect(
        (sq) => sq.select('COUNT(*)').from('challenge_group_teams', 'cgt').where('"cgt"."challengeGroupId" = "g"."id"'),
        'teamCount',
      )
      .orderBy('g.name', 'ASC')
      .getRawMany<{ id: string; name: string; challengeCount: string; teamCount: string }>();

    let joinedIds = new Set<string>();
    if (teamId) {
      const team = await this.teamRepo.findOne({
        where: { id: teamId },
        relations: { challengeGroups: true },
        select: { id: true, challengeGroups: { id: true } },
      });
      joinedIds = new Set(team?.challengeGroups.map((g) => g.id) ?? []);
    }

    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      challengeCount: Number(g.challengeCount),
      teamCount: Number(g.teamCount),
      joined: joinedIds.has(g.id),
    }));
  }

  async joinChallengeGroup(userId: string, groupId: string) {
    const teamId = await this.getUserTeamId(userId);
    if (!teamId) {
      throw new BadRequestException('Jamoangiz yo‘q! Avval jamoa tuzing yoki jamoaga qo‘shiling.');
    }

    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      select: { id: true, name: true, isBanned: true, challengeGroups: { id: true, name: true } },
      relations: { challengeGroups: true },
    });
    if (!team) throw new NotFoundException('Jamoa topilmadi');
    if (team.isBanned) throw new ForbiddenException('Sizning jamoangiz bloklangan!');

    const challengeGroup = await this.challengeGroupRepo.findOne({
      where: { id: groupId },
      select: { id: true, name: true },
    });
    if (!challengeGroup) throw new NotFoundException('Challenge guruhi topilmadi');

    if (team.challengeGroups.some((g) => g.id === groupId)) {
      throw new BadRequestException('Sizning jamoangiz bu guruhga allaqachon qo‘shilgan');
    }

    team.challengeGroups.push(challengeGroup);
    await this.teamRepo.save(team);

    return {
      success: true,
      message: `Jamoangiz "${challengeGroup.name}" guruhiga muvaffaqiyatli qo'shildi!`,
    };
  }

  // ==================== CHALLENGE'LAR ====================

  async getAvailableChallenges(userId: string, groupId?: string) {
    const now = new Date();
    const teamId = await this.getUserTeamId(userId);

    const qb = this.challengeRepo
      .createQueryBuilder('c')
      .leftJoin('c.group', 'g')
      .select([
        'c.id', 'c.title', 'c.description', 'c.points', 'c.category',
        'c.attachmentPath', 'c.startTime', 'c.endTime', 'g.id', 'g.name',
      ])
      // Hali ochilmagan vazifalar ko'rsatilmaydi
      .where('(c.startTime IS NULL OR c.startTime <= :now)', { now })
      .orderBy('c.category', 'ASC')
      .addOrderBy('c.points', 'ASC');

    if (groupId) qb.andWhere('g.id = :groupId', { groupId });

    const challenges = await qb.getMany();

    // Har bir vazifani nechta jamoa yechgani (bloklanganlar hisobga olinmaydi)
    const solveCounts = await this.submissionRepo
      .createQueryBuilder('s')
      .innerJoin('s.team', 't')
      .select('s.challengeId', 'challengeId')
      .addSelect('COUNT(DISTINCT t.id)', 'count')
      .where('s.isCorrect = true AND t.isBanned = false')
      .groupBy('s.challengeId')
      .getRawMany<{ challengeId: string; count: string }>();
    const solveCountMap = new Map(solveCounts.map((r) => [r.challengeId, Number(r.count)]));

    let solvedIds = new Set<string>();
    let joinedGroupIds = new Set<string>();
    if (teamId) {
      const solved = await this.submissionRepo
        .createQueryBuilder('s')
        .select('DISTINCT s.challengeId', 'challengeId')
        .where('s.teamId = :teamId AND s.isCorrect = true', { teamId })
        .getRawMany<{ challengeId: string }>();
      solvedIds = new Set(solved.map((r) => r.challengeId));

      const team = await this.teamRepo.findOne({
        where: { id: teamId },
        relations: { challengeGroups: true },
        select: { id: true, challengeGroups: { id: true } },
      });
      joinedGroupIds = new Set(team?.challengeGroups.map((g) => g.id) ?? []);
    }

    return challenges.map((c) => ({
      ...c,
      solveCount: solveCountMap.get(c.id) ?? 0,
      solved: solvedIds.has(c.id),
      groupJoined: c.group ? joinedGroupIds.has(c.group.id) : false,
      isClosed: !!c.endTime && c.endTime < now,
    }));
  }

  async getChallengeDetail(userId: string, challengeId: string) {
    const list = await this.getAvailableChallenges(userId);
    const challenge = list.find((c) => c.id === challengeId);
    if (!challenge) throw new NotFoundException('Vazifa topilmadi yoki hali ochilmagan');

    const solvers = await this.submissionRepo.find({
      where: { challenge: { id: challengeId }, isCorrect: true, team: { isBanned: false } },
      relations: { team: true },
      select: { id: true, submittedAt: true, pointsAwarded: true, team: { id: true, name: true } },
      order: { submittedAt: 'ASC' },
      take: 10,
    });

    return {
      ...challenge,
      firstSolvers: solvers
        .filter((s) => s.pointsAwarded > 0)
        .map((s) => ({ team: s.team, solvedAt: s.submittedAt })),
    };
  }

  async submitFlag(challengeId: string, userId: string, clientIp: string, submittedFlag: string) {
    await this.assertTournamentRunning();

    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: { id: true, isBanned: true, team: { id: true, isBanned: true } },
      relations: { team: true },
    });
    if (!user || !user.team) {
      throw new BadRequestException('Vazifa yuborish uchun avval jamoaga qo‘shilishingiz kerak!');
    }
    if (user.isBanned) throw new ForbiddenException('Sizning profilingiz bloklangan!');
    if (user.team.isBanned) throw new ForbiddenException('Sizning jamoangiz bloklangan!');

    const teamId = user.team.id;

    const challenge = await this.challengeRepo
      .createQueryBuilder('c')
      .addSelect('c.flagHash')
      .leftJoinAndSelect('c.group', 'g')
      .where('c.id = :challengeId', { challengeId })
      .getOne();
    if (!challenge) throw new NotFoundException('Vazifa topilmadi');
    if (!challenge.group) {
      throw new BadRequestException('Bu vazifa hech qanday guruhga biriktirilmagan');
    }

    const isGroupJoined = await this.teamRepo
      .createQueryBuilder('t')
      .innerJoin('t.challengeGroups', 'g', 'g.id = :groupId', { groupId: challenge.group.id })
      .where('t.id = :teamId', { teamId })
      .getExists();
    if (!isGroupJoined) {
      throw new BadRequestException('Jamoangiz bu musobaqa guruhiga qo‘shilmagan! Avval guruhga qo‘shiling.');
    }

    const now = new Date();
    if (challenge.startTime && now < challenge.startTime) {
      throw new BadRequestException('Bu vazifa hali ochilmagan');
    }
    if (challenge.endTime && now > challenge.endTime) {
      throw new BadRequestException('Bu vazifaning vaqti tugagan');
    }
    if (!isIpAllowed(clientIp, challenge.allowedIpRange)) {
      throw new ForbiddenException('Sizning IP manzilingiz bu vazifani yechish uchun ruxsat etilmagan');
    }

    // bcrypt sekin ishlaydi, shuning uchun tranzaksiyadan oldin tekshiramiz
    const isMatch = await bcrypt.compare(submittedFlag.trim(), challenge.flagHash);

    return await this.dataSource.transaction(async (manager) => {
      // Bir jamoaning parallel yuborishlari ketma-ket bajarilishi uchun jamoa qatorini qulflaymiz
      await manager
        .createQueryBuilder(Team, 't')
        .setLock('pessimistic_write')
        .where('t.id = :teamId', { teamId })
        .getOne();

      const teamAlreadySolved = await manager.exists(Submission, {
        where: { team: { id: teamId }, challenge: { id: challengeId }, isCorrect: true },
      });

      if (!isMatch) {
        await manager.save(manager.create(Submission, {
          user: { id: userId }, challenge: { id: challengeId }, team: { id: teamId }, isCorrect: false,
        }));
        return { success: false, message: 'Notog‘ri flag!' };
      }

      if (teamAlreadySolved) {
        await manager.save(manager.create(Submission, {
          user: { id: userId }, challenge: { id: challengeId }, team: { id: teamId }, isCorrect: true,
        }));
        return {
          success: true,
          alreadySolved: true,
          message: 'Flag to‘g‘ri! Lekin jamoangiz buni allaqachon yechgan (takroriy ball berilmadi)',
        };
      }

      // Vazifa ballini ham parallel yechimlar uchun qulflaymiz
      const locked = await manager
        .createQueryBuilder(Challenge, 'c')
        .setLock('pessimistic_write')
        .where('c.id = :challengeId', { challengeId })
        .getOneOrFail();

      const earnedPoints = locked.points;
      await manager.save(manager.create(Submission, {
        user: { id: userId },
        challenge: { id: challengeId },
        team: { id: teamId },
        isCorrect: true,
        pointsAwarded: earnedPoints,
      }));
      await manager.increment(Team, { id: teamId }, 'score', earnedPoints);

      // Dinamik ball: har bir yechimdan keyin vazifa qiymati kamayadi
      const nextPoints = Math.max(locked.points - locked.decrementStep, locked.minPoints);
      await manager.update(Challenge, { id: challengeId }, { points: nextPoints });

      return {
        success: true,
        pointsAwarded: earnedPoints,
        message: `Tabriklaymiz! Jamoangizga ${earnedPoints} ball qo'shildi 🎉 (Vazifa yangi qiymati: ${nextPoints} ball)`,
      };
    });
  }

  // ==================== REYTING ====================

  async getLeaderboard() {
    const rows = await this.teamRepo
      .createQueryBuilder('t')
      .leftJoin('t.submissions', 's', 's.pointsAwarded > 0')
      .select('t.id', 'id')
      .addSelect('t.name', 'name')
      .addSelect('t.score', 'score')
      .addSelect('COUNT(s.id)', 'solves')
      .addSelect('MAX(s.submittedAt)', 'lastSolveAt')
      .where('t.isBanned = false')
      .groupBy('t.id')
      // Teng ball bo'lsa, oxirgi yechimni oldinroq qilgan jamoa yuqorida turadi
      .orderBy('t.score', 'DESC')
      .addOrderBy('"lastSolveAt"', 'ASC', 'NULLS LAST')
      .addOrderBy('t.createdAt', 'ASC')
      .getRawMany<{ id: string; name: string; score: number; solves: string; lastSolveAt: Date | null }>();

    if (rows.length === 0) return [];

    const members = await this.userRepo.find({
      where: { team: { id: In(rows.map((r) => r.id)) } },
      relations: { team: true },
      select: { id: true, username: true, team: { id: true } },
    });
    const membersByTeam = new Map<string, { id: string; username: string }[]>();
    for (const m of members) {
      const list = membersByTeam.get(m.team!.id) ?? [];
      list.push({ id: m.id, username: m.username });
      membersByTeam.set(m.team!.id, list);
    }

    return rows.map((r, index) => ({
      rank: index + 1,
      id: r.id,
      name: r.name,
      score: Number(r.score),
      solves: Number(r.solves),
      lastSolveAt: r.lastSolveAt,
      members: membersByTeam.get(r.id) ?? [],
    }));
  }

  // Top jamoalar uchun ball o'sish grafigi (vaqt bo'yicha)
  async getScoreTimeline(limit = 10) {
    const top = (await this.getLeaderboard()).slice(0, limit);
    if (top.length === 0) return [];

    const solves = await this.submissionRepo
      .createQueryBuilder('s')
      .select('s.teamId', 'teamId')
      .addSelect('s.pointsAwarded', 'points')
      .addSelect('s.submittedAt', 'at')
      .where('s.pointsAwarded > 0 AND s.teamId IN (:...ids)', { ids: top.map((t) => t.id) })
      .orderBy('s.submittedAt', 'ASC')
      .getRawMany<{ teamId: string; points: number; at: Date }>();

    return top.map((team) => {
      let total = 0;
      const points = solves
        .filter((s) => s.teamId === team.id)
        .map((s) => {
          total += Number(s.points);
          return { at: s.at, score: total };
        });
      return { id: team.id, name: team.name, points };
    });
  }
}
