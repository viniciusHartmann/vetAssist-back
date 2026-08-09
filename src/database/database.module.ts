import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { Env } from '../config/env.schema';
import { EstrategiaNomeSnakePt } from './naming.strategy';
import { OPCOES_POOL, limparParametrosSsl, montarOpcoesSsl } from './opcoes-conexao';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        type: 'postgres' as const,
        url: limparParametrosSsl(config.get('DATABASE_URL', { infer: true })),
        ssl: montarOpcoesSsl(config.get('DATABASE_SSL', { infer: true })),
        autoLoadEntities: true,
        // NUNCA ligar: o schema e gerenciado manualmente nesta fase.
        synchronize: false,
        migrationsRun: false,
        migrations: ['dist/database/migrations/*.js'],
        namingStrategy: new EstrategiaNomeSnakePt(),
        logging:
          config.get('NODE_ENV', { infer: true }) === 'development'
            ? (['error', 'warn'] as const)
            : (['error'] as const),
        extra: { ...OPCOES_POOL },
        // Falha rapido e proposital: praticamente toda rota depende do banco,
        // entao subir sem conexao so trocaria um erro claro no boot por 500
        // silencioso em cada requisicao. /saude cobre a queda em tempo de execucao.
        retryAttempts: 3,
        retryDelay: 3000,
      }),
    }),
  ],
})
export class DatabaseModule {}
