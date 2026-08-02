// src/admin/dto/get-users-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Role } from '../../entity/user.entity';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, description: 'Sahifa raqami' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, description: 'Har bir sahifadagi elementlar soni (maks. 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class GetUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Fullname, email yoki username bo\'yicha qidirish' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: Role, description: 'Rol bo\'yicha filtrlash' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: 'Faqat bloklanganlar (true) yoki bloklanmaganlar (false)' })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  isBanned?: boolean;

  @ApiPropertyOptional({ description: 'O\'chirilgan foydalanuvchilarni ham ko\'rsatish', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDeleted?: boolean = false;
}

export class GetSubmissionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Vazifa ID si bo\'yicha' })
  @IsOptional()
  @IsUUID()
  challengeId?: string;

  @ApiPropertyOptional({ description: 'Jamoa ID si bo\'yicha' })
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional({ description: 'Faqat to\'g\'ri (true) yoki noto\'g\'ri (false) javoblar' })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  isCorrect?: boolean;
}

export class GetProblemsAdminQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Kod yoki nom bo\'yicha qidirish' })
  @IsOptional()
  @IsString()
  search?: string;
}
