import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitProblemDto {
  @ApiProperty({
    example: 'FLAG{hello_world_algorithmic}',
    description: 'Masalaning to\'g\'ri javobi yoki flagi',
  })
  @IsNotEmpty({ message: 'Javob (flag) bo\'sh bo\'lishi mumkin emas' })
  @IsString({ message: 'Javob matn ko\'rinishida bo\'lishi kerak' })
  flag!: string;
}