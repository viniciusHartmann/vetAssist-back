import { HttpStatus } from '@nestjs/common';

/**
 * Codigos de erro estaveis consumidos pelo frontend (ApiError.code).
 * Adicionar codigo novo e barato; renomear existente quebra o front.
 */
export const CodigoErro = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NAO_AUTENTICADO: 'NAO_AUTENTICADO',
  ACESSO_NEGADO: 'ACESSO_NEGADO',
  NAO_ENCONTRADO: 'NAO_ENCONTRADO',
  CONFLITO: 'CONFLITO',
  PAYLOAD_GRANDE: 'PAYLOAD_GRANDE',
  MUITAS_REQUISICOES: 'MUITAS_REQUISICOES',
  NAO_IMPLEMENTADO: 'NAO_IMPLEMENTADO',
  SERVICO_INDISPONIVEL: 'SERVICO_INDISPONIVEL',
  ERRO_INTERNO: 'ERRO_INTERNO',
} as const;

export type CodigoErro = (typeof CodigoErro)[keyof typeof CodigoErro];

export function mapearStatusParaCodigo(status: number): CodigoErro {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return CodigoErro.VALIDATION_ERROR;
    case HttpStatus.UNAUTHORIZED:
      return CodigoErro.NAO_AUTENTICADO;
    case HttpStatus.FORBIDDEN:
      return CodigoErro.ACESSO_NEGADO;
    case HttpStatus.NOT_FOUND:
      return CodigoErro.NAO_ENCONTRADO;
    case HttpStatus.CONFLICT:
      return CodigoErro.CONFLITO;
    case HttpStatus.PAYLOAD_TOO_LARGE:
      return CodigoErro.PAYLOAD_GRANDE;
    case HttpStatus.TOO_MANY_REQUESTS:
      return CodigoErro.MUITAS_REQUISICOES;
    case HttpStatus.NOT_IMPLEMENTED:
      return CodigoErro.NAO_IMPLEMENTADO;
    case HttpStatus.SERVICE_UNAVAILABLE:
      return CodigoErro.SERVICO_INDISPONIVEL;
    default:
      return CodigoErro.ERRO_INTERNO;
  }
}
