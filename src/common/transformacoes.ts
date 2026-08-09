import type { TransformFnParams } from 'class-transformer';

/**
 * Remove espacos nas pontas preservando a escrita original do miolo.
 *
 * Usar sempre com `@Transform(aparar)` ANTES dos validadores, para que o
 * tamanho conferido pelo `@Length` seja o do texto ja aparado.
 */
export const aparar = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Chave de deduplicacao dos catalogos (sinais clinicos e tratamentos).
 *
 * Case-insensitive de proposito: "Vomito frequente" e "vomito frequente" sao o
 * mesmo sinal e nao devem virar duas entradas no autocomplete. Acentos NAO sao
 * removidos — "vomito" sem acento e digitacao diferente, e `unaccent` nao e
 * IMMUTABLE no Postgres, entao nao poderia sustentar o indice unico.
 *
 * Espelha o indice `uq_sinais_clinicos_descricao` / `uq_tratamentos_nome`
 * (`UNIQUE (lower(coluna))`) criado na migration. Os dois precisam concordar.
 */
export const chaveDedup = (texto: string): string => texto.trim().toLowerCase();
