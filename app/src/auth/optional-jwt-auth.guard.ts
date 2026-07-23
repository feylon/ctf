import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Token bo'lsa foydalanuvchini aniqlaydi, bo'lmasa so'rovni anonim holda o'tkazadi
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(_err: any, user: any) {
    return user || undefined;
  }
}
