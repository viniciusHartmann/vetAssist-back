// TODO(escopo-futuro): implementacoes reais pendentes.
import { Module } from '@nestjs/common';
import { GatewayAnaliseProvider } from './analise/gateway.provider';
import { ANALISE_PORT } from './analise/analise.port';
import { DeepgramProvider } from './transcricao/deepgram.provider';
import { TRANSCRICAO_PORT } from './transcricao/transcricao.port';

/**
 * Ports de transcricao e analise.
 *
 * Registrados por token para que a implementacao real entre no lugar sem
 * alterar nenhum consumidor.
 */
@Module({
  providers: [
    { provide: TRANSCRICAO_PORT, useClass: DeepgramProvider },
    { provide: ANALISE_PORT, useClass: GatewayAnaliseProvider },
  ],
  exports: [TRANSCRICAO_PORT, ANALISE_PORT],
})
export class AiModule {}
