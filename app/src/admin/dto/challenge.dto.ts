// src/admin/dto/challenge.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min, IsUUID, IsDateString } from 'class-validator';

export class CreateChallengeDto {
  @ApiProperty({ example: 'SQL Injection Basics', description: 'Vazifa nomi' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Bu vazifada SQL injection zaifligidan foydalaning...', description: 'Vazifa tavsifi' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 'CTF{sql_inj_easy_flag}', description: 'Vazifaning to\'g\'ri javobi (Flag)' })
  @IsString()
  @IsNotEmpty()
  flag!: string;

  @ApiProperty({ example: 100, description: 'Vazifa uchun boshlang\'ich ball' })
  @IsInt()
  @Min(1)
  points!: number;

  @ApiProperty({ example: 10, description: 'Har bir yechilganda ball qancha kamayishi' })
  @IsInt()
  @Min(0)
  decrementStep!: number;

  @ApiProperty({ example: 20, description: 'Minimal tushishi mumkin bo\'lgan ball chegarasi' })
  @IsInt()
  @Min(1)
  minPoints!: number;

  @ApiProperty({ example: 'Web', description: 'Vazifa kategoriyasi' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiPropertyOptional({ example: '/uploads/file.zip', description: 'Fayl yo\'li' })
  @IsOptional()
  @IsString()
  attachmentPath?: string;

  @ApiPropertyOptional({ example: '2026-07-22T00:00:00.000Z', description: 'Boshlanish vaqti' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ example: '2026-07-25T23:59:59.000Z', description: 'Tugash vaqti' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ example: '*', description: 'IP cheklov' })
  @IsOptional()
  @IsString()
  allowedIpRange?: string;

  @ApiProperty({ example: 'uuid-string-of-group', description: 'Challenge guruhi ID si' })
  @IsUUID()
  groupId!: string;
}