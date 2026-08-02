import { Role } from '../../entity/user.entity';

// JWT orqali autentifikatsiyadan o'tgan foydalanuvchi (req.user)
export interface AuthUser {
  id: string;
  username: string;
  role: Role;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: Role;
}
