import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

const aparar = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CriarTratamentoDto {
  @Transform(aparar)
  @IsString({ message: 'Informe um nome' })
  @Length(2, 160, { message: 'Nome deve ter entre 2 e 160 caracteres' })
  nome: string;

  @IsOptional()
  @Transform(aparar)
  @IsString({ message: 'Descricao deve ser um texto' })
  @MaxLength(4000, { message: 'Descricao deve ter no maximo 4000 caracteres' })
  descricao?: string;
}

export class AtualizarTratamentoDto extends PartialType(CriarTratamentoDto) {}
