import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { obterRequestId } from '../request-context/request-context';
import type { ApiEnvelope } from './envelope.interface';
import { SEM_ENVELOPE } from './sem-envelope.decorator';

/** Empacota toda resposta de sucesso HTTP no formato esperado pelo frontend. */
@Injectable()
export class EnvelopeInterceptor<T> implements NestInterceptor<T, ApiEnvelope<T> | T> {
  constructor(private readonly reflector: Reflector) {}

  intercept(contexto: ExecutionContext, proximo: CallHandler<T>): Observable<ApiEnvelope<T> | T> {
    // Deixa mensagens WebSocket passarem intactas.
    if (contexto.getType() !== 'http') {
      return proximo.handle();
    }

    const semEnvelope = this.reflector.getAllAndOverride<boolean>(SEM_ENVELOPE, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (semEnvelope) {
      return proximo.handle();
    }

    return proximo.handle().pipe(
      map((dados) => ({
        data: dados ?? null,
        error: null,
        requestId: obterRequestId(),
      })),
    );
  }
}
