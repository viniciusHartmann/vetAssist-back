import { Transform } from 'class-transformer';
import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginacaoDto } from '../../common/dto/paginacao.dto';

export class ListarTranscricoesDto extends PaginacaoDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(160, { message: 'Nome deve ter no maximo 160 caracteres' })
  nome?: string;

  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'dataDe deve estar no formato ISO-8601' })
  dataDe?: string;

  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'dataAte deve estar no formato ISO-8601' })
  dataAte?: string;
}
