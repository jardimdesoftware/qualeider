import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'silva.santos@example.com',
  })
  @IsEmail()
  @MaxLength(254, { message: 'O email deve ter no máximo 254 caracteres.' })
  email!: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'password' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres.' })
  password!: string;
}
