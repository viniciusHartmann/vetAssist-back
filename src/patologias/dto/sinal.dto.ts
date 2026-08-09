import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

export class CriarSinalDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Informe a descricao do sinal clinico' })
  @Length(2, 500, { message: 'Descricao deve ter entre 2 e 500 caracteres' })
  descricao: string;
}
