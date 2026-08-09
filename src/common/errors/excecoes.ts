import { HttpException, HttpStatus } from '@nestjs/common';
import { CodigoErro } from './codigos-erro';

interface RespostaErro {
  status: number;
  code: string;
  message: string;
  fields?: Record<string, string>;
}

/**
 * Excecao da aplicacao com codigo estavel e mensagem segura para exibir ao
 * usuario. Diferente de um erro inesperado, a mensagem de uma AppException
 * pode ir para o cliente mesmo em status 5xx.
 */
export class AppException extends HttpException {
  constructor(
    readonly codigo: CodigoErro | string,
    mensagem: string,
    status: HttpStatus,
    readonly campos?: Record<string, string>,
  ) {
    super({ code: codigo, message: mensagem, fields: campos }, status);
  }

  paraResposta(): RespostaErro {
    return {
      status: this.getStatus(),
      code: this.codigo,
      message: this.message,
      fields: this.campos,
    };
  }
}

export class NaoEncontradoException extends AppException {
  constructor(mensagem = 'Recurso nao encontrado.') {
    super(CodigoErro.NAO_ENCONTRADO, mensagem, HttpStatus.NOT_FOUND);
  }
}

export class NaoAutenticadoException extends AppException {
  constructor(mensagem = 'Sessao invalida ou expirada.') {
    super(CodigoErro.NAO_AUTENTICADO, mensagem, HttpStatus.UNAUTHORIZED);
  }
}

export class AcessoNegadoException extends AppException {
  constructor(mensagem = 'Acesso negado.') {
    super(CodigoErro.ACESSO_NEGADO, mensagem, HttpStatus.FORBIDDEN);
  }
}

export class ValidacaoException extends AppException {
  constructor(mensagem: string, campos?: Record<string, string>) {
    super(CodigoErro.VALIDATION_ERROR, mensagem, HttpStatus.BAD_REQUEST, campos);
  }
}

export class ConflitoException extends AppException {
  constructor(mensagem = 'Conflito com o estado atual do recurso.') {
    super(CodigoErro.CONFLITO, mensagem, HttpStatus.CONFLICT);
  }
}

/** Usada pelos modulos esqueleto (visitas, IA). */
export class NaoImplementadoException extends AppException {
  constructor(mensagem = 'Funcionalidade ainda nao implementada.') {
    super(CodigoErro.NAO_IMPLEMENTADO, mensagem, HttpStatus.NOT_IMPLEMENTED);
  }
}
