// src/admin/dto/tournament-settings.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class UpdateTournamentSettingsDto {
  @ApiProperty({ example: true, description: 'Musobaqa faol holatda yoki to‘xtatilgan' })
  @IsBoolean()
  @IsOptional()
  isLive?: boolean;

  @ApiProperty({ example: '2026-07-25T10:00:00Z', description: 'Global boshlanish vaqti' })
  @IsDateString()
  @IsOptional()
  globalStartTime?: string;

  @ApiProperty({ example: '2026-07-26T18:00:00Z', description: 'Global tugash vaqti' })
  @IsDateString()
  @IsOptional()
  globalEndTime?: string;
}