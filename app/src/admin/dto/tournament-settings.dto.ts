// src/admin/dto/tournament-settings.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, ValidateIf } from 'class-validator';

export class UpdateTournamentSettingsDto {
  @ApiPropertyOptional({ example: true, description: 'Musobaqa faol holatda yoki to‘xtatilgan' })
  @IsBoolean()
  @IsOptional()
  isLive?: boolean;

  @ApiPropertyOptional({ example: '2026-07-25T10:00:00Z', description: 'Global boshlanish vaqti (null - cheklovsiz)', nullable: true })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString()
  globalStartTime?: string | null;

  @ApiPropertyOptional({ example: '2026-07-26T18:00:00Z', description: 'Global tugash vaqti (null - cheklovsiz)', nullable: true })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString()
  globalEndTime?: string | null;
}
