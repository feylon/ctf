// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { UserChallengesController } from './user-challenges.controller'; 
import { ChallengesModule } from '../challenges/challenges.module';

@Module({
  imports: [ChallengesModule],
  controllers: [UserChallengesController],
})
export class UserModule {}