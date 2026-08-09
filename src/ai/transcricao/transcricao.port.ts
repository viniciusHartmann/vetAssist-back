// TODO(escopo-futuro): modulo nao implementado nesta entrega.

/** Token de injecao — permite trocar a implementacao sem tocar em quem chama. */
export const TRANSCRICAO_PORT = Symbol('TRANSCRICAO_PORT');

export interface SegmentoTranscricao {
  texto: string;
  sequencia: number;
  final: boolean;
}

export interface SessaoTranscricao {
  enviarAudio(chunk: Buffer): void;
  finalizar(): Promise<void>;
  encerrar(): void;
}

export interface OpcoesTranscricao {
  idioma: string;
  sampleRate: number;
  aoReceberSegmento: (segmento: SegmentoTranscricao) => void;
  aoFalhar: (erro: Error) => void;
}

export interface TranscricaoPort {
  abrirSessao(opcoes: OpcoesTranscricao): Promise<SessaoTranscricao>;
}
