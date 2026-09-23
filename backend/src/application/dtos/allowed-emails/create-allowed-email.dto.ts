import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAllowedEmailDto {
  @ApiProperty({
    description: 'Email de fora do domínio ifpe.edu.br liberado para acessar via Google',
    example: 'pessoa@gmail.com',
  })
  @IsNotEmpty({ message: 'O email não pode ser vazio.' })
  @IsEmail(
    { allow_display_name: false, require_tld: true },
    { message: 'O email fornecido não é válido.' },
  )
  @MaxLength(254, { message: 'O email deve ter no máximo 254 caracteres.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email!: string;
}
