import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';
import { aparar } from '../../common/transformacoes';

/** Usado standalone (POST /sinais) e aninhado em `novosSinais[]`. */
export class CriarSinalDto {
  @Transform(aparar)
  @IsString({ message: 'Informe a descricao do sinal clinico' })
  @Length(2, 500, { message: 'Descricao deve ter entre 2 e 500 caracteres' })
  descricao: string;
}

export class AtualizarSinalDto extends PartialType(CriarSinalDto) {}

export class ListarSinaisDto {
  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(160, { message: 'Busca deve ter no maximo 160 caracteres' })
  busca?: string;

  // `@Type` explicito: enableImplicitConversion esta desligado no ValidationPipe.
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um numero inteiro' })
  @Min(1, { message: 'Limite minimo e 1' })
  @Max(50, { message: 'Limite maximo e 50' })
  limite?: number;
}

/** Query da exclusao: `?forcar=true` aceita apagar um sinal ainda vinculado. */
export class RemoverDoCatalogoDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  forcar?: boolean;
}
