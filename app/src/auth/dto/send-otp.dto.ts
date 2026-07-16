import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    example: faker.internet.email(),
    description: 'Foydalanuvchining email manzili',
  })
  @IsEmail()
  email!: string;
}