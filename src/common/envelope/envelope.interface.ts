/**
 * Formato de resposta que o frontend espera (lib/api/client.ts).
 *
 * ATENCAO: o cliente chama `response.json()` ANTES de checar `response.ok`.
 * Qualquer resposta sem este corpo — HTML de erro, corpo vazio — vira erro de
 * parse no navegador e mascara a falha real. Todo caminho de saida precisa
 * produzir este envelope.
 */
export interface ErroEnvelope {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export interface ApiEnvelope<T> {
  data: T | null;
  error: ErroEnvelope | null;
  requestId: string;
}
