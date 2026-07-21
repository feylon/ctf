import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({ example: false, description: 'Foydalanuvchi faolligini o\'zgartirish (true - aktiv, false - ban)' })
  @IsBoolean()
  isActive!: boolean;
}