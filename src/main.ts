// TZ fixo em UTC antes do bootstrap: garante que filtros de data produzam o
// mesmo resultado independentemente do fuso da maquina que roda a aplicacao.
process.env.TZ = 'UTC';

import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { WsAdapter } from '@nestjs/platform-ws';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { EnvelopeInterceptor } from './common/envelope/envelope.interceptor';
import { FiltroExcecoes } from './common/errors/filtro-excecoes';
import { criarValidationPipe } from './common/pipes/validation.pipe';
import { RequestIdMiddleware } from './common/request-context/request-id.middleware';
import type { Env } from './config/env.schema';

const LIMITE_CORPO = '1mb';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService<Env, true>);

  // Antes de tudo: erro de parse do body tambem precisa sair com requestId.
  // Registrado aqui, e nao so no AppModule, para preceder o express.json().
  const requestId = new RequestIdMiddleware();
  app.use(requestId.use.bind(requestId));

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser(config.get('COOKIE_SECRET', { infer: true })));

  // Audio nunca trafega por HTTP (so pelo WebSocket), entao 1mb sobra.
  app.use(express.json({ limit: LIMITE_CORPO }));
  app.use(express.urlencoded({ limit: LIMITE_CORPO, extended: true }));

  // Origem explicita + credentials. Curinga ('*') e rejeitado pelo navegador
  // quando ha credentials e quebraria todas as chamadas do frontend.
  app.enableCors({
    origin: [config.get('CORS_ORIGIN', { infer: true })],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86_400,
  });

  app.useGlobalPipes(criarValidationPipe());
  app.useGlobalInterceptors(new EnvelopeInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new FiltroExcecoes());
  app.useWebSocketAdapter(new WsAdapter(app));

  // Necessario para o rate limiting enxergar o IP real atras de proxy.
  app.set('trust proxy', 1);
  app.enableShutdownHooks();

  const porta = config.get('PORT', { infer: true });
  await app.listen(porta, '0.0.0.0');
}

void bootstrap();
