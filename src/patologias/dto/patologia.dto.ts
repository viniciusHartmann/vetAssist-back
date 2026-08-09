import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { aparar } from '../../common/transformacoes';
import { Especie } from '../entities/patologia.entity';
import { CriarSinalDto } from './sinal.dto';
import { CriarTratamentoDto } from './tratamento.dto';

/** Teto por requisicao: `save()` com N:N emite queries de diff por relacao. */
const LIMITE_VINCULOS = 100;

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

  /** Ids de sinais que ja existem no catalogo (escolhidos no autocomplete). */
  @IsOptional()
  @IsArray({ message: 'sinaisIds deve ser uma lista' })
  @ArrayMaxSize(LIMITE_VINCULOS, { message: `No maximo ${LIMITE_VINCULOS} sinais` })
  @IsUUID('4', { each: true, message: 'sinaisIds deve conter uuids validos' })
  sinaisIds?: string[];

  /**
   * Sinais digitados na hora. Se a descricao ja existir no catalogo (comparacao
   * case-insensitive), o existente e reaproveitado em vez de duplicar.
   */
  @IsOptional()
  @IsArray({ message: 'novosSinais deve ser uma lista' })
  @ArrayMaxSize(LIMITE_VINCULOS, { message: `No maximo ${LIMITE_VINCULOS} sinais` })
  @ValidateNested({ each: true })
  @Type(() => CriarSinalDto)
  novosSinais?: CriarSinalDto[];

  @IsOptional()
  @IsArray({ message: 'tratamentosIds deve ser uma lista' })
  @ArrayMaxSize(LIMITE_VINCULOS, { message: `No maximo ${LIMITE_VINCULOS} tratamentos` })
  @IsUUID('4', { each: true, message: 'tratamentosIds deve conter uuids validos' })
  tratamentosIds?: string[];

  @IsOptional()
  @IsArray({ message: 'novosTratamentos deve ser uma lista' })
  @ArrayMaxSize(LIMITE_VINCULOS, { message: `No maximo ${LIMITE_VINCULOS} tratamentos` })
  @ValidateNested({ each: true })
  @Type(() => CriarTratamentoDto)
  novosTratamentos?: CriarTratamentoDto[];
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
