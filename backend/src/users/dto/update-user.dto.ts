import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, IsEmail, IsEnum, MinLength, IsNotEmpty } from 'class-validator';
import { Role, UserType, UserCategory } from '../interfaces/user.interface';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) { }