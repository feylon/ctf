// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../entity/user.entity';
import { ChallengeGroup } from 'src/entity/challenge_groups.entity';
import { Challenge } from 'src/entity/challenge.entity';
import { Team } from 'src/entity/team.entity';
import { Submission } from 'src/entity/submissions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ChallengeGroup, Submission, Challenge, Team])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}