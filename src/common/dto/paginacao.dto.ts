import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginacaoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page deve ser um numero inteiro' })
  @Min(1, { message: 'page deve ser no minimo 1' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit deve ser um numero inteiro' })
  @Min(1, { message: 'limit deve ser no minimo 1' })
  @Max(100, { message: 'limit deve ser no maximo 100' })
  limit: number = 20;
}

export interface RespostaPaginada<T> {
  itens: T[];
  total: number;
  page: number;
  limit: number;
  totalPaginas: number;
}

export function montarRespostaPaginada<T>(
  itens: T[],
  total: number,
  page: number,
  limit: number,
): RespostaPaginada<T> {
  return {
    itens,
    total,
    page,
    limit,
    totalPaginas: Math.max(1, Math.ceil(total / limit)),
  };
}
