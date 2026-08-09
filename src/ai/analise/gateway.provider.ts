// TODO(escopo-futuro): modulo nao implementado nesta entrega.
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema';
import { NaoImplementadoException } from '../../common/errors/excecoes';
import type { AnalisePort, ContextoClinico } from './analise.port';
import type { AnaliseValidada } from './analise.schema';

/**
 * Analise estruturada via AI Gateway — ainda nao escrita.
 *
 * Como no provider da Deepgram, a config e lida dentro do metodo para nao
 * bloquear o boot quando as variaveis opcionais estao vazias.
 */
@Injectable()
export class GatewayAnaliseProvider implements AnalisePort {
  constructor(private readonly config: ConfigService<Env, true>) {}

  analisar(_texto: string, _contexto: ContextoClinico): Promise<AnaliseValidada> {
    const chave = this.config.get('AI_GATEWAY_API_KEY', { infer: true });
    const modelo = this.config.get('AI_GATEWAY_MODEL', { infer: true });

    if (!chave || !modelo) {
      throw new NaoImplementadoException(
        'Analise indisponivel: AI_GATEWAY_API_KEY ou AI_GATEWAY_MODEL nao configurados.',
      );
    }

    throw new NaoImplementadoException('Analise estruturada ainda nao implementada.');
  }
}
