import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { armazenamentoRequisicao } from './request-context';

const CABECALHO_REQUEST_ID = 'x-request-id';
/** Aceita apenas identificadores simples vindos do cliente. */
const FORMATO_VALIDO = /^[\w-]{1,64}$/;

/**
 * Roda antes de guards, interceptors e filtros — por isso o requestId existe
 * mesmo quando um guard rejeita a requisicao ou a rota nem chega a existir.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const recebido = req.headers[CABECALHO_REQUEST_ID];
    const candidato = Array.isArray(recebido) ? recebido[0] : recebido;

    const requestId =
      typeof candidato === 'string' && FORMATO_VALIDO.test(candidato) ? candidato : randomUUID();

    res.setHeader(CABECALHO_REQUEST_ID, requestId);

    armazenamentoRequisicao.run({ requestId }, () => next());
  }
}
