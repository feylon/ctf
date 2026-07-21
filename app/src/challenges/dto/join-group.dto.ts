// src/challenges/dto/join-group.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class JoinChallengeGroupDto {
  @ApiProperty({ example: 'uuid-challenge-group-id', description: 'Qo‘shilmoqchi bo‘lgan Challenge Guruh ID si' })
  @IsUUID()
  @IsNotEmpty()
  groupId!: string;
}