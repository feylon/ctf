// src/admin/dto/adjust-score.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class AdjustScoreDto {
  @ApiProperty({ example: 50, description: 'Qo‘shiladigan (+) yoki ayiriladigan (-) ball miqdori' })
  @IsInt()
  @IsNotEmpty()
  points!: number;

  @ApiProperty({ example: 'Qoidabuzarlik uchun jarima', description: 'Ball o‘zgartirilish sababi' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}