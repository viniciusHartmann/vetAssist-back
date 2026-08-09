import { z } from 'zod';

/**
 * Contrato de saida da analise clinica (BACKEND_SPEC.md).
 *
 * Escrito desde ja porque e o formato que o modelo tera de satisfazer, e a
 * validacao com Zod e justamente o que impede a IA de inventar tratamento
 * fora do catalogo — o resultado ainda passa por um filtro contra as
 * patologias e tratamentos cadastrados antes de ir ao frontend.
 */
export const esquemaAnalise = z.object({
  patologiasIdentificadas: z.array(
    z.object({
      patologiaId: z.string().uuid().nullable(),
      nome: z.string().min(1),
      confianca: z.number().min(0).max(1),
      evidencias: z.array(z.string()),
    }),
  ),
  tratamentosRelacionados: z.array(
    z.object({
      patologiaId: z.string().uuid(),
      patologia: z.string().min(1),
      tratamentos: z.array(
        z.object({
          tratamentoId: z.string().uuid(),
          nome: z.string().min(1),
        }),
      ),
    }),
  ),
  resumo: z.string(),
  alertas: z.array(z.string()),
});

export type AnaliseValidada = z.infer<typeof esquemaAnalise>;
