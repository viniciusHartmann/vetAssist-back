// TODO(escopo-futuro): modulo nao implementado nesta entrega.

/**
 * Contrato de mensagens do WebSocket de visitas (BACKEND_SPEC.md).
 *
 * O campo `version` esta presente desde o inicio para permitir evoluir o
 * contrato sem quebrar clientes antigos.
 */

export interface MensagemBase<T extends string, P> {
  version?: string;
  type: T;
  payload: P;
  requestId?: string;
  sequence?: number;
}

// --- Frontend -> Backend ---

export type MensagemEntrada =
  | MensagemBase<'session.start', { locale: string; sampleRate: number }>
  | MensagemBase<'audio.chunk', { data: string }>
  | MensagemBase<'recording.stop', Record<string, never>>
  | MensagemBase<'transcription.confirm', { name: string }>
  | MensagemBase<'transcription.discard', Record<string, never>>;

// --- Backend -> Frontend ---

export type MensagemSaida =
  | MensagemBase<
      'session.ready',
      { sessionId: string; audioFormat: string; sampleRate: number }
    >
  | MensagemBase<'transcript.partial', { text: string; sequence: number }>
  | MensagemBase<'transcript.final', { text: string; sequence: number }>
  | MensagemBase<'analysis.started', Record<string, never>>
  | MensagemBase<'analysis.ready', { transcriptionId: string; analysis: unknown }>
  | MensagemBase<'transcription.saved', { transcriptionId: string }>
  | MensagemBase<'session.error', { code: string; message: string }>;
