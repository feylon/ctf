import { IsNotEmpty, IsString, IsInt, Min, Max, MaxLength, Matches } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateProblemDto {
  @ApiProperty({ example: 'A0001', description: 'Masalaning noyob tartib kodi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'Kod faqat harf, raqam, _ va - dan iborat bo\'lishi kerak' })
  code!: string;

  @ApiProperty({ example: 'A+B' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ example: 'Ikkita butun sonning yig\'indisini toping...', description: 'Masala sharti (Markdown)' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: '42' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  flag!: string; // Admin ochiq holda kiritadi, bazaga hashlanib tushadi

  @ApiProperty({ example: 35, description: 'Qiyinlik darajasi (0-100)' })
  @IsInt()
  @Min(0)
  @Max(100)
  difficulty!: number;

  @ApiProperty({ example: 'Uzun sonlar arifmetikasi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category!: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  points!: number;
}

export class UpdateProblemDto extends PartialType(CreateProblemDto) {}
