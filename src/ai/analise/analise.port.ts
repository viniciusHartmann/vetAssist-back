// TODO(escopo-futuro): modulo nao implementado nesta entrega.
import type { AnaliseValidada } from './analise.schema';

export const ANALISE_PORT = Symbol('ANALISE_PORT');

/** Catalogo real enviado ao modelo. A IA so pode usar o que vier aqui. */
export interface ContextoClinico {
  patologias: {
    id: string;
    nome: string;
    especie: string;
    descricao: string;
    sinais: string[];
    tratamentos: { id: string; nome: string; descricao: string }[];
  }[];
}

export interface AnalisePort {
  analisar(textoCompleto: string, contexto: ContextoClinico): Promise<AnaliseValidada>;
}
