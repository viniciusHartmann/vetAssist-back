import { AsyncLocalStorage } from 'node:async_hooks';

export interface StoreRequisicao {
  requestId: string;
  usuarioId?: string;
}

/**
 * Contexto por requisicao. Usado para que o filtro de excecoes e o logger
 * alcancem o requestId sem precisar receber o objeto `req` por parametro.
 */
export const armazenamentoRequisicao = new AsyncLocalStorage<StoreRequisicao>();

export function obterRequestId(): string {
  return armazenamentoRequisicao.getStore()?.requestId ?? 'sem-request-id';
}

export function definirUsuarioAtual(usuarioId: string): void {
  const store = armazenamentoRequisicao.getStore();
  if (store) {
    store.usuarioId = usuarioId;
  }
}
