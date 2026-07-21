// src/challenges/challenges.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Challenge } from '../entity/challenge.entity';
import { Submission } from '../entity/submissions.entity';
import { User } from '../entity/user.entity';
import { Team } from '../entity/team.entity';
import { ChallengesService } from './challenges.service';
import { ChallengeGroup } from 'src/entity/challenge_groups.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Challenge, Submission, User, Team, ChallengeGroup])],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}