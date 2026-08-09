import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiEnvelope } from '../envelope/envelope.interface';
import { obterRequestId } from '../request-context/request-context';
import { CodigoErro, mapearStatusParaCodigo } from './codigos-erro';
import { AppException } from './excecoes';

interface CorpoHttpException {
  code?: string;
  message?: string | string[];
  fields?: Record<string, string>;
}

/**
 * Filtro global. `@Catch()` sem argumento e proposital: pega TUDO, inclusive
 * erros que nao sao HttpException (ex.: QueryFailedError do TypeORM), para
 * garantir que nenhuma resposta escape sem o envelope JSON.
 */
@Catch()
export class FiltroExcecoes implements ExceptionFilter {
  private readonly logger = new Logger(FiltroExcecoes.name);

  catch(excecao: unknown, host: ArgumentsHost): void {
    // WebSocket tem canal proprio de erro (session.error); nao envelopar aqui.
    if (host.getType() !== 'http') {
      return;
    }

    const resposta = host.switchToHttp().getResponse<Response>();
    const requestId = obterRequestId();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = CodigoErro.ERRO_INTERNO;
    let message = 'Erro interno no servidor.';
    let fields: Record<string, string> | undefined;

    if (excecao instanceof AppException) {
      const dados = excecao.paraResposta();
      status = dados.status;
      code = dados.code;
      message = dados.message;
      fields = dados.fields;
    } else if (excecao instanceof HttpException) {
      status = excecao.getStatus();
      const corpo = excecao.getResponse();

      if (typeof corpo === 'object' && corpo !== null) {
        const dados = corpo as CorpoHttpException;
        code = dados.code ?? mapearStatusParaCodigo(status);
        fields = dados.fields;

        const mensagemBruta = dados.message;
        message = Array.isArray(mensagemBruta)
          ? mensagemBruta.join('; ')
          : (mensagemBruta ?? excecao.message);
      } else {
        code = mapearStatusParaCodigo(status);
        message = typeof corpo === 'string' ? corpo : excecao.message;
      }
    } else {
      // Erro inesperado: registrar completo no servidor, devolver generico.
      this.logger.error(
        { err: excecao, requestId },
        'Excecao nao tratada',
        excecao instanceof Error ? excecao.stack : undefined,
      );
    }

    // Nunca vazar detalhe interno (stack, SQL, nome de tabela) em 5xx.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR && !(excecao instanceof AppException)) {
      message = 'Erro interno no servidor.';
      fields = undefined;
    }

    // Se a resposta ja comecou a ser enviada (ex.: redirect), nao ha o que fazer.
    if (resposta.headersSent) {
      return;
    }

    const envelope: ApiEnvelope<never> = {
      data: null,
      error: { code, message, ...(fields ? { fields } : {}) },
      requestId,
    };

    resposta.status(status).json(envelope);
  }
}
