// src/admin/dto/create-folder.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateFolderDto {
  @ApiProperty({ example: 'Forensics', description: 'Papka nomi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Ota papka ID si (agar bo\'lmasa bo\'sh qoladi)' })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}

export class RenameFolderDto {
  @ApiProperty({ example: 'Web', description: 'Yangi papka nomi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}

export class FolderQueryDto {
  @ApiPropertyOptional({ description: 'Ota papka ID si (bo\'sh bo\'lsa root)' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
