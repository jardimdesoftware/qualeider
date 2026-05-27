import { PartialType } from '@nestjs/swagger';
import { CreateAnimalSpeciesDto } from './create-animal-species.dto';

export class UpdateAnimalSpeciesDto extends PartialType(CreateAnimalSpeciesDto) {}
