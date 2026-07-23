import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MailerModule } from '@nestjs-modules/mailer';
import KeyvRedis from '@keyv/redis';
import { ChallengeGroup } from './entity/challenge_groups.entity';
import { Challenge } from './entity/challenge.entity';
import { Participation } from './entity/participations.entity';
import { Submission } from './entity/submissions.entity';
import { User } from './entity/user.entity';
import { LoginHistory } from './entity/login-history.entity';
import { Team } from './entity/team.entity';
import { TournamentSettings } from './entity/tournament-settings.entity';
import { Folder } from './entity/folder.entity';
import { FileEntity } from './entity/file.entity';
import { News } from './entity/news.entity';
import { ProblemSubmission } from './entity/problem-submission.entity';
import { Problem } from './entity/problem.entity';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { UserModule } from './user/user.module';
import { NewsModule } from './news/news.module';
import { ProblemModule } from './problem/problem.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: false,
        synchronize: false,
        entities: [
          User, Challenge, News, ChallengeGroup, Submission, Participation, LoginHistory,
          TournamentSettings, Team, FileEntity, Folder, Problem, ProblemSubmission,
        ],
      }),
    }),
    // Redis kesh (OTP, refresh tokenlar). cache-manager v7 Keyv store'larini ishlatadi
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: 600_000,
        stores: [
          new KeyvRedis(
            `redis://${config.get('REDIS_HOST', 'localhost')}:${config.get('REDIS_PORT', 6379)}`,
          ),
        ],
      }),
    }),
    // Umumiy cheklov: bir IP dan 1 daqiqada 120 ta so'rov. Muhim endpointlarda qattiqroq
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // MAIL_HOST berilmasa (lokal ishlab chiqish) xatlar yuborilmaydi, faqat logga yoziladi
        transport: config.get<string>('MAIL_HOST')
          ? {
            host: config.get<string>('MAIL_HOST'),
            port: Number(config.get('MAIL_PORT', 587)),
            secure: config.get('MAIL_SECURE') === 'true',
            auth: {
              user: config.get<string>('MAIL_USER'),
              pass: config.get<string>('MAIL_PASS'),
            },
          }
          : { jsonTransport: true },
        defaults: {
          from: config.get('MAIL_FROM', '"CTF Platform" <noreply@ctf.uz>'),
        },
      }),
    }),
    AuthModule, AdminModule, UserModule, NewsModule, ProblemModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule { }
