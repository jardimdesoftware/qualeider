import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Email do usuário' })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(254, { message: 'O email deve ter no máximo 254 caracteres.' })
  email!: string;

  @ApiProperty({ description: 'Token de redefinição' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'O token deve ter 6 dígitos.' })
  token!: string;

  @ApiProperty({ description: 'Nova senha (mínimo 6 caracteres)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
  @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres.' })
  newPassword!: string;
}
