import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RedisClientOptions } from 'redis';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entity/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { LoginHistory } from 'src/entity/login-history.entity';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    TypeOrmModule.forFeature([User, LoginHistory]),
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      useFactory: async (): Promise<any> => {
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
    })],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule { }
