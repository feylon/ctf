import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';
import { Problem } from '../entity/problem.entity';
import { ProblemSubmission } from '../entity/problem-submission.entity';
import { User } from '../entity/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Problem, ProblemSubmission, User]),
  ],
  controllers: [ProblemController],
  providers: [ProblemService],
  exports: [ProblemService], // Agar boshqa modullardan ishlatish kerak bo'lsa
})
export class ProblemModule {}