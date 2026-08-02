import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { AuthUser, JwtPayload } from '../common/types/auth-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    // Bloklangan yoki o'chirilgan foydalanuvchi eski token bilan ham kira olmasligi uchun
    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      select: { id: true, username: true, role: true, isActive: true, isDelete: true, isBanned: true },
    });

    if (!user || user.isDelete || !user.isActive || user.isBanned) {
      throw new UnauthorizedException('Hisobingiz faol emas yoki bloklangan');
    }

    // Rol o'zgargan bo'lsa ham bazadagi joriy qiymat ishlatiladi
    return { id: user.id, username: user.username, role: user.role };
  }
}
