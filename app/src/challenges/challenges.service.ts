// src/challenges/challenges.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from '../entity/challenge.entity';
import { Submission } from '../entity/submissions.entity';
import { User } from '../entity/user.entity';
import { Team } from '../entity/team.entity';
import * as bcrypt from 'bcrypt';
import { ChallengeGroup } from 'src/entity/challenge_groups.entity';

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge) private readonly challengeRepo: Repository<Challenge>,
    @InjectRepository(Submission) private readonly submissionRepo: Repository<Submission>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Team) private readonly teamRepo: Repository<Team>,
    @InjectRepository(ChallengeGroup) private readonly challengeGroupRepo: Repository<ChallengeGroup>,
    
  ) {}

  async createTeam(userId: string, teamName: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: { id: true, team: { id: true, name: true } },
      relations: { team: true },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    if (user.team) throw new BadRequestException('Siz allaqachon boshqa jamoadasiz');

    const existingTeam = await this.teamRepo.findOne({
      where: { name: teamName },
      select: { id: true, name: true },
    });
    if (existingTeam) throw new BadRequestException('Bu nomdagi jamoa allaqachon mavjud');

    const team = this.teamRepo.create({ name: teamName });
    await this.teamRepo.save(team);

    user.team = team;
    await this.userRepo.save(user);

    return { message: 'Jamoa muvaffaqiyatli yaratildi', team };
  }

  async joinTeam(userId: string, teamId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: { id: true, team: { id: true, name: true } },
      relations: { team: true },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    if (user.team) throw new BadRequestException('Siz allaqachon jamoadasiz');

    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      select: { id: true, name: true, members: { id: true, username: true } },
      relations: { members: true },
    });
    if (!team) throw new NotFoundException('Jamoa topilmadi');

    if (team.members.length >= 3) {
      throw new BadRequestException('Bu jamoa to‘la (maksimal 3 ta ishtirokchi ruxsat etilgan)');
    }

    user.team = team;
    await this.userRepo.save(user);

    return { message: 'Jamoaga muvaffaqiyatli qo‘shildingiz', team };
  }

  async getAvailableChallenges() {
    return await this.challengeRepo.find({
      select: {
        id: true,
        title: true,
        description: true,
        points: true,
        category: true,
        attachmentPath: true,
        startTime: true,
        endTime: true,
        group: {
          id: true,
          name: true,
        },
      },
      relations: { group: true },
    });
  }

  async submitFlag(challengeId: string, userId: string, clientIp: string, submittedFlag: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: { id: true, team: { id: true, name: true } },
      relations: { team: true },
    });
    if (!user || !user.team) {
      throw new BadRequestException('Vazifa yuborish uchun avval jamoaga qo‘shilishingiz kerak!');
    }

    const teamId = user.team.id;

    // 1. Vazifa va uning guruhini birga topamiz
    const challenge = await this.challengeRepo.findOne({
      where: { id: challengeId },
      select: {
        id: true,
        points: true,
        initialPoints: true,
        minPoints: true,
        decrementStep: true,
        flagHash: true,
        startTime: true,
        endTime: true,
        allowedIpRange: true,
        group: { id: true, name: true },
      },
      relations: { group: true },
    });
    if (!challenge) throw new NotFoundException('Vazifa topilmadi');

    if (!challenge.group) {
      throw new BadRequestException('Bu vazifa hech qanday guruhga biriktirilmagan');
    }

    const challengeGroupId = challenge.group.id;

    // 2. Jamoaning guruhlarga a'zoligini tekshiramiz
    const teamWithGroups = await this.teamRepo.findOne({
      where: { id: teamId },
      select: { id: true, challengeGroups: { id: true } },
      relations: { challengeGroups: true },
    });

    const isGroupJoined = teamWithGroups?.challengeGroups.some((g) => g.id === challengeGroupId);
    if (!isGroupJoined) {
      throw new BadRequestException('Jamoangiz bu musobaqa guruhiga qo‘shilmagan! Avval guruhga qo‘shiling.');
    }

    const now = new Date();
    if (challenge.startTime && now < new Date(challenge.startTime)) {
      throw new BadRequestException('Bu vazifa hali ochilmagan');
    }
    if (challenge.endTime && now > new Date(challenge.endTime)) {
      throw new BadRequestException('Bu vazifaning vaqti tugagan');
    }

    if (challenge.allowedIpRange && challenge.allowedIpRange !== '*') {
      if (challenge.allowedIpRange !== clientIp) {
        throw new ForbiddenException('Sizning IP manzilingiz bu vazifani yechish uchun ruxsat etilmagan');
      }
    }

    const teamAlreadySolved = await this.submissionRepo.findOne({
      where: {
        team: { id: teamId },
        challenge: { id: challengeId },
        isCorrect: true,
      },
      select: { id: true, isCorrect: true },
    });

    const isMatch = await bcrypt.compare(submittedFlag, challenge.flagHash);

    const submission = this.submissionRepo.create({
      user: { id: userId },
      challenge: { id: challengeId },
      team: { id: teamId },
      isCorrect: isMatch,
    });
    await this.submissionRepo.save(submission);

    if (!isMatch) {
      return { success: false, message: 'Notog‘ri flag!' };
    }

    if (!teamAlreadySolved) {
      const earnedPoints = challenge.points;

      const team = await this.teamRepo.findOne({
        where: { id: teamId },
        select: { id: true, score: true },
      });
      if (team) {
        team.score += earnedPoints;
        await this.teamRepo.save(team);
      }

      // Ballni kamaytirish logikasi
      const nextPoints = challenge.points - challenge.decrementStep;
      challenge.points = nextPoints < challenge.minPoints ? challenge.minPoints : nextPoints;
      await this.challengeRepo.save(challenge);

      return {
        success: true,
        message: `Tabriklaymiz! Jamoangizga ${earnedPoints} ball qo'shildi 🎉 (Vazifa yangi qiymati: ${challenge.points} ball)`,
      };
    }

    return {
      success: true,
      message: 'Flag to‘g‘ri! Lekin jamoangiz buni allaqachon yechgan (takroriy ball berilmadi)',
    };
  }


  // src/challenges/challenges.service.ts ichiga qo'shiladi:

  async joinChallengeGroup(userId: string, groupId: string) {
    // 1. User va uning jamoasini topamiz
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: { id: true, team: { id: true, name: true } },
      relations: { team: true },
    });
    
    if (!user || !user.team) {
      throw new BadRequestException('Jamoangiz yo‘q! Avval jamoa tuzing yoki jamoaga qo‘shiling.');
    }

    const teamId = user.team.id;

    // 2. Jamoani to'liq ma'lumotlari va uning guruhlari bilan olamiz
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      select: { id: true, name: true, challengeGroups: { id: true, name: true } },
      relations: { challengeGroups: true },
    });

    if (!team) throw new NotFoundException('Jamoa topilmadi');

    // 3. Challenge Group ni topamiz
    const challengeGroup = await this.challengeGroupRepo.findOne({
      where: { id: groupId },
      select: { id: true, name: true },
    });

    if (!challengeGroup) throw new NotFoundException('Challenge guruhi topilmadi');

    // 4. Jamoa allaqachon bu guruhga qo'shilganligini tekshiramiz
    const isAlreadyJoined = team.challengeGroups.some((g) => g.id === groupId);
    if (isAlreadyJoined) {
      throw new BadRequestException('Sizning jamoangiz bu guruhga allaqachon qo‘shilgan');
    }

    // 5. Jamoani guruhga bog'laymiz
    team.challengeGroups.push(challengeGroup);
    await this.teamRepo.save(team);

    return {
      success: true,
      message: `Jamoangiz "${challengeGroup.name}" guruhiga muvaffaqiyatli qo'shildi!`,
    };
  }



  async getLeaderboard() {
    return await this.teamRepo.find({
      select: {
        id: true,
        name: true,
        score: true,
        members: {
          id: true,
          username: true, 
        },
      },
      relations: { members: true },
      order: { score: 'DESC' }, 
    });
  }



  // src/challenges/challenges.service.ts ichiga qo'shiladi:

  async getMyTeam(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: { id: true, team: { id: true } },
      relations: { team: true },
    });

    if (!user || !user.team) {
      throw new NotFoundException('Siz hali hech qanday jamoada emassiz');
    }

    return await this.teamRepo.findOne({
      where: { id: user.team.id },
      select: {
        id: true,
        name: true,
        score: true,
        createdAt: true,
        members: { id: true, username: true, email: true },
        submissions: {
          id: true,
          isCorrect: true,
        //   ["createdAt"]: true,
          challenge: { id: true, title: true, points: true },
        },
        challengeGroups: { id: true, name: true },
      },
      relations: { members: true, submissions: { challenge: true }, challengeGroups: true },
    });
  }
}