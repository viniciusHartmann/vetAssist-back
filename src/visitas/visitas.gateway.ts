// TODO(escopo-futuro): modulo nao implementado nesta entrega.
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnGatewayConnection, WebSocketGateway } from '@nestjs/websockets';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';
import type { Env } from '../config/env.schema';
import type { MensagemSaida } from './tipos/mensagens.type';

/** Codigo de fechamento WS para "erro interno / nao implementado". */
const CODIGO_FECHAMENTO_INTERNO = 1011;
const CODIGO_FECHAMENTO_POLITICA = 1008;

/**
 * Gateway da sessao de visita clinica — ESQUELETO.
 *
 * Mantem o endpoint acessivel para que o frontend receba uma resposta de
 * protocolo clara (session.error) em vez de ECONNREFUSED, mas nao transcreve
 * nada. Nao ha conexao com a Deepgram aqui.
 *
 * O que falta para a proxima etapa:
 * - maquina de estados da sessao (ver tipos/estado-sessao.type.ts)
 * - validacao de sample rate e locale no session.start
 * - streaming de audio para a Deepgram Nova-2
 * - heartbeat ping/pong, limite de duracao e de tamanho de mensagem
 * - limite de sessoes simultaneas por IP
 * - analise via AI Gateway e persistencia apos transcription.confirm
 */
@WebSocketGateway({ path: '/ws/visitas' })
export class VisitasGateway implements OnGatewayConnection {
  private readonly logger = new Logger(VisitasGateway.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  handleConnection(cliente: WebSocket, requisicao: IncomingMessage): void {
    const origem = requisicao.headers.origin;
    const origemPermitida = this.config.get('CORS_ORIGIN', { infer: true });

    if (origem && origem !== origemPermitida) {
      this.logger.warn({ origem }, 'Conexao WebSocket recusada por origem invalida');
      cliente.close(CODIGO_FECHAMENTO_POLITICA, 'Origem nao permitida');
      return;
    }

    const sessionId = randomUUID();
    this.logger.log({ sessionId }, 'Sessao de visita solicitada (nao implementada)');

    const mensagem: MensagemSaida = {
      version: '1',
      type: 'session.error',
      payload: {
        code: 'NAO_IMPLEMENTADO',
        message: 'Sessao de visita ainda nao implementada.',
      },
    };

    cliente.send(JSON.stringify(mensagem));
    cliente.close(CODIGO_FECHAMENTO_INTERNO, 'Nao implementado');
  }
}
