// TODO(escopo-futuro): modulo nao implementado nesta entrega.

/** Estados da sessao de visita clinica (BACKEND_SPEC.md). */
export type EstadoSessao =
  | 'connected'
  | 'ready'
  | 'recording'
  | 'stopping'
  | 'transcribing'
  | 'analyzing'
  | 'awaiting_confirmation'
  | 'saved'
  | 'failed'
  | 'closed';

/** Estados equivalentes no frontend. */
export type EstadoFrontend =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'analyzing'
  | 'awaiting_confirmation'
  | 'saved'
  | 'failed';
