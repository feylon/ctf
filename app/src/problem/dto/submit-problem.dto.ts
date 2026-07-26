import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitProblemDto {
  @ApiProperty({
    example: 'FLAG{hello_world_algorithmic}',
    description: 'Masalaning to\'g\'ri javobi yoki flagi',
  })
  @IsNotEmpty({ message: 'Javob (flag) bo\'sh bo\'lishi mumkin emas' })
  @IsString({ message: 'Javob matn ko\'rinishida bo\'lishi kerak' })
  @MaxLength(255)
  flag!: string;
}