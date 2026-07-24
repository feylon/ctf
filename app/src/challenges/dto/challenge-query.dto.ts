import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class ChallengeQueryDto {
  @ApiPropertyOptional({ description: 'Faqat shu guruhdagi vazifalar' })
  @IsOptional()
  @IsUUID()
  groupId?: string;
}
