import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'silva.santos@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(254, { message: 'O email deve ter no máximo 254 caracteres.' })
  email!: string;
}
