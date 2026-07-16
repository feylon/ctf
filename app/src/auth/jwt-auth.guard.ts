import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  
  handleRequest(err, user, info, context) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Sizda Bearer token yo\'q yoki yaroqsiz!');
    }

    if (err || !user) {
      throw err || new UnauthorizedException('Token yaroqsiz yoki muddati o\'tgan!');
    }

    return user;
  }
}