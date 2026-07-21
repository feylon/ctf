// src/admin/dto/create-folder.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFolderDto {
  @ApiProperty({ example: 'Forensics', description: 'Papka nomi' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Ota papka ID si (agar bo\'lmasa bo\'sh qoladi)' })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}