import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';
import { aparar } from '../../common/transformacoes';

/** Usado standalone (POST /tratamentos) e aninhado em `novosTratamentos[]`. */
export class CriarTratamentoDto {
  @Transform(aparar)
  @IsString({ message: 'Informe um nome' })
  @Length(2, 160, { message: 'Nome deve ter entre 2 e 160 caracteres' })
  nome: string;

  /** Observacao de como o tratamento funciona. */
  @IsOptional()
  @Transform(aparar)
  @IsString({ message: 'Descricao deve ser um texto' })
  @MaxLength(4000, { message: 'Descricao deve ter no maximo 4000 caracteres' })
  descricao?: string;
}

export class AtualizarTratamentoDto extends PartialType(CriarTratamentoDto) {}

export class ListarTratamentosDto {
  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(160, { message: 'Busca deve ter no maximo 160 caracteres' })
  busca?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um numero inteiro' })
  @Min(1, { message: 'Limite minimo e 1' })
  @Max(50, { message: 'Limite maximo e 50' })
  limite?: number;
}
