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
import { TournamentSettings } from 'src/entity/tournament-settings.entity';
import { FileManagerController } from './file-manager.controller';
import { FileManagerService } from './file-manager.service';
import { FileEntity } from 'src/entity/file.entity';
import { Folder } from 'src/entity/folder.entity';
import { News } from 'src/entity/news.entity';
import { Problem } from 'src/entity/problem.entity';
import { ProblemSubmission } from 'src/entity/problem-submission.entity';
import { LoginHistory } from 'src/entity/login-history.entity';
import { NewsModule } from 'src/news/news.module';

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
