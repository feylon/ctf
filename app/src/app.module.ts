import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ChallengeGroup } from './entity/challenge_groups.entity';
import { Challenge } from './entity/challenge.entity';
import { Participation } from './entity/participations.entity';
import { Submission } from './entity/submissions.entity';
import { User } from './entity/user.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import type { RedisClientOptions } from 'redis';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { JwtStrategy } from './auth/jwt.strategy';
import { LoginHistory } from './entity/login-history.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env"
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: false, 
        synchronize: false,    
        entities : [User, Challenge, ChallengeGroup, Submission, Participation, LoginHistory]
      }),
    }),
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      useFactory: async () : Promise<any> => {
        const store = await redisStore({
          socket: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
          },
          ttl: 600000, 
        });
        return {
          store: store as any,
        };
      },
    }),
    MailerModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    transport: {
      host: config.get<string>('MAIL_HOST'),
      port: config.get<number>('MAIL_PORT'),
      auth: {
        user: config.get<string>('MAIL_USER'),
        pass: config.get<string>('MAIL_PASS'),
      },
    },
    defaults: {
      from: '"CTF Platform" <noreply@ctf.uz>',
    },
  }),
}),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule implements OnModuleInit {

  constructor(private readonly config: ConfigService) { }

  onModuleInit() {
    console.log(this.config.getOrThrow<string>("TEST"))
  }
}
