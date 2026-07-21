// src/challenges/dto/submit-flag.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitFlagDto {
  @ApiProperty({ example: 'CTF{flag_here}', description: 'Vazifa uchun flag' })
  @IsString()
  @IsNotEmpty()
  flag!: string;
}