// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../entity/user.entity';
import { ChallengeGroup } from '../entity/challenge_groups.entity';
import { Challenge } from '../entity/challenge.entity';
import { Team } from '../entity/team.entity';
import { Submission } from '../entity/submissions.entity';
import { TournamentSettings } from '../entity/tournament-settings.entity';
import { FileManagerController } from './file-manager.controller';
import { FileManagerService } from './file-manager.service';
import { FileEntity } from '../entity/file.entity';
import { Folder } from '../entity/folder.entity';
import { News } from '../entity/news.entity';
import { Problem } from '../entity/problem.entity';
import { ProblemSubmission } from '../entity/problem-submission.entity';
import { LoginHistory } from '../entity/login-history.entity';
import { NewsModule } from '../news/news.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, FileEntity, News, Folder, Problem, ProblemSubmission, ChallengeGroup,
      TournamentSettings, Submission, Challenge, Team, LoginHistory,
    ]),
    NewsModule,
  ],
  controllers: [AdminController, FileManagerController],
  providers: [AdminService, FileManagerService],
})
export class AdminModule { }
