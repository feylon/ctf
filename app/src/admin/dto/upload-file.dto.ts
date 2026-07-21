// src/admin/dto/upload-file.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UploadFileDto {
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Fayl yuklanadigan papka ID si' })
  @IsUUID()
  @IsOptional()
  folderId?: string;
}