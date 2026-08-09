import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/guards/auth.guard';
import { obterRequestId, armazenamentoRequisicao } from './common/request-context/request-context';
import { validarEnv, type Env } from './config/env.schema';
import { DatabaseModule } from './database/database.module';
import { PatologiasModule } from './patologias/patologias.module';
import { SaudeController } from './saude/saude.controller';
import { TranscricoesModule } from './transcricoes/transcricoes.module';
import { VisitasModule } from './visitas/visitas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validarEnv,
      cache: true,
    }),

    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const desenvolvimento = config.get('NODE_ENV', { infer: true }) === 'development';

        return {
          pinoHttp: {
            level: config.get('LOG_LEVEL', { infer: true }),
            genReqId: () => obterRequestId(),
            customProps: () => {
              const store = armazenamentoRequisicao.getStore();
              return { requestId: store?.requestId, usuarioId: store?.usuarioId };
            },
            // Nunca registrar credenciais nem dados de sessao.
            redact: {
              paths: [
                'req.headers.cookie',
                'req.headers.authorization',
                'res.headers["set-cookie"]',
                '*.password',
                '*.token',
                '*.access_token',
                '*.refresh_token',
                '*.code',
                '*.code_verifier',
                '*.apiKey',
                '*.SUPABASE_SERVICE_ROLE_KEY',
                '*.DEEPGRAM_API_KEY',
              ],
              remove: true,
            },
            autoLogging: {
              ignore: (req) => req.url === '/saude',
            },
            transport: desenvolvimento ? { target: 'pino-pretty' } : undefined,
          },
        };
      },
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => [
        {
          ttl: config.get('THROTTLE_TTL_SECONDS', { infer: true }) * 1000,
          limit: config.get('THROTTLE_LIMIT', { infer: true }),
        },
      ],
    }),

    DatabaseModule,
    AuthModule,
    PatologiasModule,
    TranscricoesModule,

    // Esqueletos: carregam, mas nao implementam nada ainda.
    VisitasModule,
    AiModule,
  ],
  controllers: [SaudeController],
  providers: [
    // Ordem importa: throttler antes do auth.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
// O RequestIdMiddleware e registrado em main.ts, antes do body parser, para
// que ate erro de JSON malformado saia com requestId no envelope.
export class AppModule {}
