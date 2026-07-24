// src/challenges/dto/team-action.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({ example: 'CyberPunks', description: 'Jamoa nomi (3-32 belgi)' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 32)
  @Matches(/^[\p{L}\p{N} _.-]+$/u, { message: 'Jamoa nomida faqat harf, raqam, probel va _ . - bo‘lishi mumkin' })
  name!: string;
}

export class JoinTeamDto {
  @ApiProperty({ example: 'A1B2C3D4E5', description: 'Jamoa sardoridan olingan taklif kodi' })
  @IsString()
  @IsNotEmpty()
  @Length(4, 16)
  inviteCode!: string;
}
