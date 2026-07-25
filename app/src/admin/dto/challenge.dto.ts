// src/admin/dto/challenge.dto.ts
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidIpRange } from 'src/common/helpers/ip-range.helper';

@ValidatorConstraint({ name: 'ipRange' })
class IpRangeConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return typeof value === 'string' && isValidIpRange(value);
  }
  defaultMessage() {
    return "allowedIpRange formati noto'g'ri. Masalan: *, 192.168.1.5 yoki 10.0.0.0/8 (vergul bilan bir nechta)";
  }
}

export class CreateChallengeDto {
  @ApiProperty({ example: 'SQL Injection Basics', description: 'Vazifa nomi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ example: 'Bu vazifada SQL injection zaifligidan foydalaning...', description: 'Vazifa tavsifi (Markdown)' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 'CTF{sql_inj_easy_flag}', description: 'Vazifaning to\'g\'ri javobi (Flag)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
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
  @MaxLength(50)
  category!: string;

  @ApiPropertyOptional({ example: '/uploads/file.zip', description: 'Biriktirilgan fayl manzili' })
  @IsOptional()
  @IsString()
  attachmentPath?: string | null;

  @ApiPropertyOptional({ example: '2026-07-22T00:00:00.000Z', description: 'Boshlanish vaqti' })
  @IsOptional()
  @IsDateString()
  startTime?: string | null;

  @ApiPropertyOptional({ example: '2026-07-25T23:59:59.000Z', description: 'Tugash vaqti' })
  @IsOptional()
  @IsDateString()
  endTime?: string | null;

  @ApiPropertyOptional({ example: '*', description: 'IP cheklov: *, aniq IP yoki CIDR (vergul bilan)' })
  @IsOptional()
  @IsString()
  @Validate(IpRangeConstraint)
  allowedIpRange?: string;

  @ApiProperty({ example: 'uuid-string-of-group', description: 'Challenge guruhi ID si' })
  @IsUUID()
  groupId!: string;
}

export class UpdateChallengeDto extends PartialType(CreateChallengeDto) {}
