# Modulo `visitas` — NAO IMPLEMENTADO

Esqueleto da sessao de visita clinica via WebSocket (`/ws/visitas`).

## O que existe hoje

- `visitas.gateway.ts` — aceita a conexao, valida a origem, responde
  `session.error` com codigo `NAO_IMPLEMENTADO` e fecha.
- `tipos/estado-sessao.type.ts` — a maquina de estados definida no SPEC.
- `tipos/mensagens.type.ts` — o contrato de mensagens de entrada e saida.

O endpoint fica de pe de proposito: assim o frontend recebe uma resposta de
protocolo tratavel em vez de `ECONNREFUSED`.

## O que falta

1. Maquina de estados da sessao.
2. Validacao de `locale` e `sampleRate` no `session.start`.
3. Streaming de audio para a Deepgram Nova-2 (ver `src/ai/`).
4. Heartbeat ping/pong, limite de duracao e de tamanho de mensagem.
5. Limite de sessoes simultaneas por IP.
6. Analise via AI Gateway.
7. Persistencia idempotente apos `transcription.confirm`.

## Cuidados

- Nunca registrar audio bruto nem a transcricao completa em log.
- O `EnvelopeInterceptor` e o `FiltroExcecoes` ignoram contexto WebSocket de
  proposito — erros aqui viajam pelo canal `session.error`, nao pelo envelope.
