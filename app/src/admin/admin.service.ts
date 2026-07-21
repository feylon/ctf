// src/admin/admin.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ChallengeGroup } from 'src/entity/challenge_groups.entity';
import { CreateChallengeGroupDto, UpdateChallengeGroupDto } from './dto/challenge-group.dto';
import { Challenge } from 'src/entity/challenge.entity';
import * as bcrypt from 'bcrypt';
import { CreateChallengeDto } from './dto/challenge.dto';
import { Team } from 'src/entity/team.entity';
import { Submission } from 'src/entity/submissions.entity';
import { AdjustScoreDto } from './dto/adjust-score.dto';
import { TournamentSettings } from 'src/entity/tournament-settings.entity';
import { UpdateTournamentSettingsDto } from './dto/tournament-settings.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ChallengeGroup) private readonly groupRepo: Repository<ChallengeGroup>,
    @InjectRepository(Challenge) private readonly challengeRepo: Repository<Challenge>,
    @InjectRepository(Team) private readonly teamRepo: Repository<Team>,
    @InjectRepository(Submission) private readonly submissionRepo: Repository<Submission>,
    @InjectRepository(TournamentSettings) private readonly tournamentSettingsRepo: Repository<TournamentSettings>,

    // tournamentSettingsRepo
  ) { }

  async getAllUsers(query: GetUsersQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepo.createQueryBuilder('user');

    // FullName, email va username bo'yicha qidirish
    if (query.search) {
      queryBuilder.andWhere(
        '(user.fullName ILIKE :search OR user.email ILIKE :search OR user.username ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Maxfiy ma'lumotlarni chiqarib tashlab, keraklilarini tanlaymiz
    queryBuilder.select([
      'user.id',
      'user.fullName',
      'user.email',
      'user.username',
      'user.role',
      'user.score',
      'user.isActive',
      'user.createdAt',
    ]);

    const [data, total] = await queryBuilder.getManyAndCount();

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



  async updateUserStatus(id: string, dto: UpdateUserStatusDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    user.isActive = dto.isActive;
    return await this.userRepo.save(user);
  }

  async updateUserRole(id: string, dto: UpdateUserRoleDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    user.role = dto.role;
    return await this.userRepo.save(user);
  }

  async deleteUser(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    user.isDelete = true;
    user.isActive = false;
    await this.userRepo.save(user);

    return { message: 'Foydalanuvchi muvaffaqiyatli o\'chirildi (soft delete)' };
  }



  async createGroup(dto: CreateChallengeGroupDto) {
    const group = this.groupRepo.create(dto);
    return await this.groupRepo.save(group);
  }

  async getAllGroups() {
    return await this.groupRepo.find({
      relations: {
        challenges: true
      },
    });
  }

  async updateGroup(id: string, dto: UpdateChallengeGroupDto) {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('Challenge guruhi topilmadi');
    }

    group.name = dto.name;
    return await this.groupRepo.save(group);
  }

  async deleteGroup(id: string) {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('Challenge guruhi topilmadi');
    }

    await this.groupRepo.remove(group);
    return { message: 'Challenge guruhi muvaffaqiyatli o\'chirildi' };
  }

  async createChallenge(dto: CreateChallengeDto) {
    // Guruh mavjudligini tekshiramiz
    const group = await this.groupRepo.findOne({ where: { id: dto.groupId } });
    if (!group) {
      throw new NotFoundException('Challenge guruhi topilmadi');
    }

    // Flag'ni xavfsizlik uchun hash qilamiz
    const salt = await bcrypt.genSalt(10);
    const flagHash = await bcrypt.hash(dto.flag, salt);

    const challenge = this.challengeRepo.create({
      title: dto.title,
      description: dto.description,
      flagHash,
      points: dto.points,
      category: dto.category,
      attachmentPath: dto.attachmentPath,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      allowedIpRange: dto.allowedIpRange || '*',
      group,
    });

    return await this.challengeRepo.save(challenge);
  }

  async getAllChallenges() {
    return await this.challengeRepo.find({
      relations: {
        group : true
      },
      // select: { flagHash: false } -> entity'da select: false qo'yilgan bo'lsa ham qo'shimcha xavfsizlik
    });
  }

  async deleteChallenge(id: string) {
    const challenge = await this.challengeRepo.findOne({ where: { id } });
    if (!challenge) {
      throw new NotFoundException('Challenge topilmadi');
    }

    await this.challengeRepo.remove(challenge);
    return { message: 'Challenge muvaffaqiyatli o\'chirildi' };
  }


  async getAllTeams() {
    return await this.teamRepo.find({
      relations: 
      // ['members', 'submissions', 'submissions.challenge']
      {
        members : true,
        // submissions : true,
        submissions : {
          challenge : true
        }
      },
      order: { score: 'DESC' }, // Ballari bo'yicha reyting tartibida
    });
  }

  async deleteTeam(id: string) {
    const team = await this.teamRepo.findOne({ where: { id }, relations: {members : true} });
    if (!team) {
      throw new NotFoundException('Jamoa topilmadi');
    }

    // Jamoadagi foydalanuvchilarning team bog'liqligini tozalaymiz (null qilamiz)
    for (const member of team.members) {
      member.team = undefined;
      await this.userRepo.save(member);
    }

    await this.teamRepo.remove(team);
    return { message: 'Jamoa muvaffaqiyatli o\'chirildi va a\'zolari bo\'shatildi' };
  }



  // src/admin/admin.service.ts ichiga qo'shiladigan metod:

  async getAllSubmissions() {
    return await this.submissionRepo.find({
      select: {
        id: true,
        isCorrect: true,
        submittedAt: true, // Entity'dagi aniq maydon nomi
        user: {
          id: true,
          username: true,
        },
        team: {
          id: true,
          name: true,
        },
        challenge: {
          id: true,
          title: true,
          points: true,
        },
      },
      relations: {
        user: true,
        team: true,
        challenge: true,
      },
      order: {
        submittedAt: 'DESC', // Eng oxirgi yuborilganlar birinchi chiqadi
      },
    });
  }


  // src/admin/admin.service.ts ichiga qo'shiladigan metod:

  async adjustTeamScore(teamId: string, dto: AdjustScoreDto) {
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      select: { id: true, name: true, score: true },
    });

    if (!team) {
      throw new NotFoundException('Jamoa topilmadi');
    }

    // Ballni yangilaymiz (manfiy son bo'lsa kamayadi, musbat bo'lsa qo'shiladi)
    team.score += dto.points;
    
    // Ball 0 dan past bo'lib ketishining oldini olish (ixtiyoriy)
    if (team.score < 0) {
      team.score = 0;
    }

    await this.teamRepo.save(team);

    return {
      success: true,
      message: `"${team.name}" jamoasining balli o'zgartirildi. Joriy ball: ${team.score}`,
      team: {
        id: team.id,
        name: team.name,
        newScore: team.score,
        reason: dto.reason,
      },
    };
  }


  // src/admin/admin.service.ts ichiga qo'shiladigan metodlar:

  async toggleUserBan(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: { id: true, username: true, isBanned: true },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    user.isBanned = !user.isBanned;
    await this.userRepo.save(user);

    return {
      success: true,
      message: `Foydalanuvchi "${user.username}" ${user.isBanned ? 'bloklandi (banned)' : 'blokdan chiqarildi (unbanned)'}`,
      isBanned: user.isBanned,
    };
  }

  async toggleTeamBan(teamId: string) {
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      select: { id: true, name: true, isBanned: true },
    });

    if (!team) {
      throw new NotFoundException('Jamoa topilmadi');
    }

    team.isBanned = !team.isBanned;
    await this.teamRepo.save(team);

    return {
      success: true,
      message: `"${team.name}" jamoasi ${team.isBanned ? 'bloklandi (banned)' : 'blokdan chiqarildi (unbanned)'}`,
      isBanned: team.isBanned,
    };
  }

  // src/admin/admin.service.ts ichiga qo'shiladigan metodlar:

  async getTournamentSettings() {
    let settings = await this.tournamentSettingsRepo.findOne({ where: {} });
    if (!settings) {
      settings = this.tournamentSettingsRepo.create({ isLive: true });
      await this.tournamentSettingsRepo.save(settings);
    }
    return settings;
  }

  async updateTournamentSettings(dto: UpdateTournamentSettingsDto) {
    let settings = await this.tournamentSettingsRepo.findOne({ where: {} });
    if (!settings) {
      settings = this.tournamentSettingsRepo.create();
    }

    if (dto.isLive !== undefined) settings.isLive = dto.isLive;
    if (dto.globalStartTime !== undefined) settings.globalStartTime = new Date(dto.globalStartTime);
    if (dto.globalEndTime !== undefined) settings.globalEndTime = new Date(dto.globalEndTime);

    await this.tournamentSettingsRepo.save(settings);

    return {
      success: true,
      message: 'Musobaqa sozlamalari muvaffaqiyatli yangilandi',
      settings,
    };
  }
}