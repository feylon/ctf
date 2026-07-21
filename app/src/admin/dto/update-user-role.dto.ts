
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from 'global/types';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: Role, example: Role.MODERATOR, description: 'Foydalanuvchi roli' })
  @IsEnum(Role)
  role!: Role;
}