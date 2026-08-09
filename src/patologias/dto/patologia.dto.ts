import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { Especie } from '../entities/patologia.entity';

const aparar = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CriarPatologiaDto {
  @Transform(aparar)
  @IsString({ message: 'Informe um nome' })
  @Length(2, 160, { message: 'Nome deve ter entre 2 e 160 caracteres' })
  nome: string;

  @IsEnum(Especie, { message: 'Especie deve ser cao, gato ou ambos' })
  especie: Especie;

  @IsOptional()
  @Transform(aparar)
  @IsString({ message: 'Descricao deve ser um texto' })
  @MaxLength(4000, { message: 'Descricao deve ter no maximo 4000 caracteres' })
  descricao?: string;
}

export class AtualizarPatologiaDto extends PartialType(CriarPatologiaDto) {}

export class ListarPatologiasDto {
  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(160, { message: 'Busca deve ter no maximo 160 caracteres' })
  busca?: string;

  @IsOptional()
  @IsEnum(Especie, { message: 'Especie deve ser cao, gato ou ambos' })
  especie?: Especie;
}
