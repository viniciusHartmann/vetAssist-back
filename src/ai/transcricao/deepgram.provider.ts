// TODO(escopo-futuro): modulo nao implementado nesta entrega.
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema';
import { NaoImplementadoException } from '../../common/errors/excecoes';
import type { OpcoesTranscricao, SessaoTranscricao, TranscricaoPort } from './transcricao.port';

/**
 * Implementacao Deepgram Nova-2 — ainda nao escrita.
 *
 * IMPORTANTE: a config e lida DENTRO do metodo, nunca no construtor. E isso
 * que permite a aplicacao subir sem DEEPGRAM_API_KEY configurada.
 */
@Injectable()
export class DeepgramProvider implements TranscricaoPort {
  constructor(private readonly config: ConfigService<Env, true>) {}

  abrirSessao(_opcoes: OpcoesTranscricao): Promise<SessaoTranscricao> {
    const chave = this.config.get('DEEPGRAM_API_KEY', { infer: true });

    if (!chave) {
      throw new NaoImplementadoException(
        'Transcricao indisponivel: DEEPGRAM_API_KEY nao configurada.',
      );
    }

    throw new NaoImplementadoException('Transcricao em tempo real ainda nao implementada.');
  }
}
