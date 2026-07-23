import { ApiProperty } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: faker.internet.username(),
    description: 'Foydalanuvchi nomi yoki email',
  })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    example: faker.internet.password({ length: 10 }),
    description: 'Parol',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}