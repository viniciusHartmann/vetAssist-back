# Modulo `ai` — NAO IMPLEMENTADO

Define os *ports* (interfaces) de transcricao e analise. As implementacoes
reais entram depois, sem alterar quem consome.

## O que existe hoje

- `transcricao/transcricao.port.ts` — interface da sessao de transcricao.
- `transcricao/deepgram.provider.ts` — lanca `NAO_IMPLEMENTADO` (501).
- `analise/analise.port.ts` — interface da analise + contexto clinico.
- `analise/analise.schema.ts` — **schema Zod da saida, ja escrito**. E o
  contrato que o modelo tera de satisfazer.
- `analise/gateway.provider.ts` — lanca `NAO_IMPLEMENTADO` (501).

## Por que os providers nao quebram o boot

`DEEPGRAM_API_KEY`, `AI_GATEWAY_API_KEY` e `AI_GATEWAY_MODEL` sao opcionais no
schema de env. Os providers leem a config **dentro dos metodos**, nunca no
construtor — se lessem no construtor, a ausencia da chave impediria a
aplicacao de subir.

## Regras que a implementacao devera respeitar

- Enviar ao modelo apenas o catalogo real de patologias e tratamentos.
- Validar a resposta com `esquemaAnalise` antes de qualquer uso.
- Descartar todo tratamento que nao exista no cadastro.
- Nunca registrar em log o prompt interno, a transcricao completa ou a analise.
- Tratar o resultado como apoio a decisao, jamais como diagnostico.

## Dependencias ainda nao instaladas

`@deepgram/sdk` e `ai`/`@ai-sdk/*` foram deixados de fora de proposito — nao
faz sentido carregar SDK pesado de funcionalidade que ainda nao existe.
