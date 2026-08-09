# VetAssist — Backend

API do assistente clinico veterinario. NestJS + TypeORM + Postgres (Supabase),
com autenticacao Google via OAuth do Supabase.

Repositorio separado do frontend (`vetAssist-front`), que roda em
`http://localhost:3000` e consome esta API em `http://localhost:4000`.

---

## Requisitos

- Node.js **>= 20.11** (testado em v20.13.0)
- Acesso ao projeto Supabase

Tres dependencias estao fixadas de proposito porque as versoes mais novas
exigem Node 22+: `typeorm@0.3.31`, `@supabase/supabase-js@2.109.0` e
`eslint@9`. Nao atualize sem antes subir a versao do Node.

---

## Setup

```bash
npm install
cp .env.example .env   # e preencher (ver secao Variaveis de ambiente)
npm run start:dev
```

Antes da primeira execucao util e preciso, no painel do Supabase:

1. Rodar o SQL da secao **Schema do banco** (nao ha migrations — ver aviso).
2. Habilitar o Google em **Authentication > Providers**, com a URL de callback
   `http://localhost:4000/auth/google/callback`.
   No Google Cloud Console, o redirect autorizado e o do Supabase:
   `https://wvasefpzyixvvvqklunw.supabase.co/auth/v1/callback`.

---

## Variaveis de ambiente

| Variavel | Obrigatoria | Descricao |
|---|---|---|
| `NODE_ENV` | nao | `development` (padrao), `test` ou `production` |
| `PORT` | nao | Padrao `4000` |
| `CORS_ORIGIN` | nao | Origem do frontend. Padrao `http://localhost:3000` |
| `FRONTEND_URL` | nao | Destino do redirect apos o login |
| `DATABASE_URL` | **sim** | Conexao Postgres do Supabase |
| `DATABASE_SSL` | nao | `true` por padrao |
| `SUPABASE_URL` | **sim** | URL do projeto |
| `SUPABASE_ANON_KEY` | **sim** | Chave publica, usada na troca do codigo OAuth |
| `SUPABASE_SERVICE_ROLE_KEY` | **sim** | Chave privada. **Somente no servidor** |
| `APP_JWT_SECRET` | **sim** | Min. 32 caracteres. Assina o cookie de sessao |
| `COOKIE_SECRET` | **sim** | Min. 32 caracteres. Assina o cookie de state/PKCE |
| `SESSION_TTL_SECONDS` | nao | Padrao `604800` (7 dias) |
| `COOKIE_DOMAIN` | nao | Vazio em localhost |
| `THROTTLE_TTL_SECONDS` / `THROTTLE_LIMIT` | nao | Padrao 60s / 120 req |
| `LOG_LEVEL` | nao | Padrao `info` |
| `DEEPGRAM_API_KEY` | nao | Modulo nao implementado |
| `AI_GATEWAY_API_KEY` / `AI_GATEWAY_MODEL` | nao | Modulo nao implementado |
| `MAX_VISIT_DURATION_SECONDS` / `AUDIO_SAMPLE_RATE` | nao | Modulo nao implementado |

`APP_JWT_SECRET` e `COOKIE_SECRET` devem ser **segredos diferentes**. Gere com:

```bash
openssl rand -hex 32
```

Env invalida derruba o boot com a lista de problemas — de proposito, para nao
falhar so na primeira requisicao.

---

## Endpoints

Nao ha prefixo `/api` — o frontend chama a raiz (`lib/api/client.ts`).

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| GET | `/saude` | publica | Status da app e do banco |
| GET | `/auth/google/url` | publica | URL de autorizacao do Google |
| GET | `/auth/google/callback` | publica | Callback OAuth (responde 302) |
| GET | `/auth/me` | sim | Usuario atual |
| POST | `/auth/logout` | sim | Encerra a sessao |
| GET | `/patologias?busca=&especie=` | sim | Lista com sinais e tratamentos |
| GET | `/patologias/:id` | sim | Detalhe |
| POST | `/patologias` | sim | Cria |
| PATCH | `/patologias/:id` | sim | Atualiza |
| DELETE | `/patologias/:id` | sim | Remove (cascata nos filhos) |
| POST | `/patologias/:id/sinais` | sim | Adiciona sinal clinico |
| DELETE | `/patologias/:id/sinais/:sinalId` | sim | Remove sinal |
| POST | `/patologias/:id/tratamentos` | sim | Adiciona tratamento |
| PATCH | `/patologias/:id/tratamentos/:tratamentoId` | sim | Atualiza tratamento |
| DELETE | `/patologias/:id/tratamentos/:tratamentoId` | sim | Remove tratamento |
| GET | `/transcricoes?nome=&dataDe=&dataAte=&page=&limit=` | sim | Lista paginada |
| GET | `/transcricoes/:id` | sim | Detalhe |
| DELETE | `/transcricoes/:id` | sim | Remove |
| WS | `/ws/visitas` | — | **Nao implementado** (responde `NAO_IMPLEMENTADO`) |

### Formato das respostas

Toda resposta HTTP — inclusive erro, 404 e 401 — sai neste envelope:

```json
{ "data": {}, "error": null, "requestId": "..." }
```

```json
{
  "data": null,
  "error": { "code": "VALIDATION_ERROR", "message": "Dados invalidos.",
             "fields": { "nome": "Nome deve ter entre 2 e 160 caracteres" } },
  "requestId": "..."
}
```

Isso e obrigatorio, nao estetico: o cliente chama `response.json()` **antes**
de checar `response.ok`. Uma resposta em HTML ou com corpo vazio vira erro de
parse no navegador e esconde a falha real.

### Convencao de nomes

Rotas e campos em portugues: `nome`, `especie`, `descricao`, `criadoEm`,
`urlAvatar`, `duracaoSegundos`. Colunas do banco em snake_case
(`criado_em`, `url_avatar`), convertidas pela `EstrategiaNomeSnakePt`.

---

## Schema do banco

> **AVISO 1 — nao ha migrations.** Conforme decidido no planejamento,
> `synchronize` esta desligado e `src/database/migrations/` esta vazio.
> **As tabelas precisam ser criadas manualmente** no SQL editor do Supabase,
> senao toda consulta retorna erro 500.

```sql
create extension if not exists "pgcrypto";

create table usuarios (
  id uuid primary key default gen_random_uuid(),
  supabase_id text not null unique,
  email text not null unique,
  nome text,
  url_avatar text,
  provedor text not null default 'google',
  ultimo_login_em timestamptz,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table patologias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  especie text not null check (especie in ('cao','gato','ambos')),
  descricao text not null default '',
  usuario_id uuid references usuarios(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index idx_patologias_especie on patologias(especie);
create index idx_patologias_nome on patologias(nome);
create index idx_patologias_usuario_id on patologias(usuario_id);

create table sinais_clinicos (
  id uuid primary key default gen_random_uuid(),
  patologia_id uuid not null references patologias(id) on delete cascade,
  descricao text not null,
  criado_em timestamptz not null default now()
);
create index idx_sinais_clinicos_patologia_id on sinais_clinicos(patologia_id);

create table tratamentos (
  id uuid primary key default gen_random_uuid(),
  patologia_id uuid not null references patologias(id) on delete cascade,
  nome text not null,
  descricao text not null default '',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index idx_tratamentos_patologia_id on tratamentos(patologia_id);

create table transcricoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  gravada_em timestamptz not null default now(),
  duracao_segundos integer not null check (duracao_segundos >= 0),
  texto_completo text not null,
  analise jsonb not null,
  usuario_id uuid references usuarios(id) on delete set null,
  criado_em timestamptz not null default now()
);
create index idx_transcricoes_gravada_em on transcricoes(gravada_em desc);
create index idx_transcricoes_nome_gin
  on transcricoes using gin(to_tsvector('simple', nome));
create index idx_transcricoes_usuario_id on transcricoes(usuario_id);

-- Defesa em profundidade: o backend conecta como `postgres` e ignora RLS,
-- mas qualquer acesso acidental via anon key no navegador fica negado.
alter table usuarios        enable row level security;
alter table patologias      enable row level security;
alter table sinais_clinicos enable row level security;
alter table tratamentos     enable row level security;
alter table transcricoes    enable row level security;
```

Quando o projeto adotar migrations versionadas:

```bash
npm run migration:generate -- src/database/migrations/NomeDaMigration
npm run migration:run
```

---

## Avisos importantes

> **AVISO 2 — cookie em producao.** O cookie de sessao usa
> `SameSite=Lax`, que funciona em desenvolvimento porque `:3000` e `:4000` sao
> o mesmo site. **Se o backend for para um dominio diferente do frontend, isto
> precisa virar `SameSite=None` + `Secure`** (`src/auth/sessao.service.ts`),
> senao o login para de funcionar sem erro visivel.

> **AVISO 3 — pooler do Supabase.** A conexao configurada e a **direta**
> (porta 5432), que em algumas redes e IPv6-only. Se a conexao travar, use o
> pooler em modo *session*. No pooler de *transacao* (porta 6543) e preciso
> desabilitar prepared statements, senao o pgbouncer quebra o TypeORM.
> O SSL usa `rejectUnauthorized: false`; em producao, baixe a CA do Supabase e
> troque por `{ ca, rejectUnauthorized: true }`.

> **AVISO 4 — ajuste pendente no frontend.** `lib/auth/use-current-user.ts`
> declara `name` e `avatarUrl` (ingles), mas `/auth/me` responde `nome` e
> `urlAvatar`. Sem esse ajuste no repositorio do frontend, a interface exibe
> `undefined`.

> **AVISO 5 — transcricoes ficam vazias.** Nada grava transcricao nesta
> entrega: a criacao acontece no fluxo WebSocket, que e esqueleto. A listagem
> retorna vazia ate que existam linhas — nao e bug.

---

## Arquitetura

```
src/
├── config/         validacao de env com Zod (falha o boot se invalida)
├── common/         envelope, filtro de excecoes, requestId, ValidationPipe
├── database/       DataSource, naming strategy pt, entidade base
├── auth/           OAuth Google, sessao em cookie, guard global
├── patologias/     CRUD + sinais clinicos + tratamentos
├── transcricoes/   consulta e remocao
├── visitas/        ESQUELETO — WebSocket da visita clinica
└── ai/             ESQUELETO — ports de transcricao e analise
```

Pontos de decisao que valem conhecer:

- **Guard global.** Toda rota nasce protegida; abrir exige `@Publico()`.
  O inverso deixaria rota nova desprotegida por esquecimento.
- **Cookie de sessao.** JWT HS256 proprio com `{ sub, sid, iat, exp }`. O token
  do Supabase **nao** e guardado — o Google serve so como identidade no login,
  entao nao ha refresh token a proteger. O `sid` permite revogacao por sessao
  no futuro sem mudar o formato do cookie.
- **PKCE + state.** Obrigatorios no fluxo OAuth. Sem `state`, um atacante
  consegue forcar a vitima a logar na conta dele.
- **Multi-tenant preparado.** `usuario_id` ja e gravado e circula pelos
  services, mas o catalogo e compartilhado. A flag `ISOLAMENTO_ATIVO` em
  `patologias.service.ts` liga o isolamento sem mudar chamada nenhuma.
- **Rotas aninhadas validam o pai.** Remover um sinal confere que ele pertence
  a patologia do path — sem isso seria possivel apagar o sinal de outra
  patologia adivinhando o id (IDOR).
- **Datas em UTC.** `TZ=UTC` e fixado antes do bootstrap e datas sem fuso sao
  lidas como UTC, para que o fuso do servidor nao altere resultados.

### O que nunca deve ir para o log

Audio, transcricao completa, conteudo da analise, prompts internos, qualquer
API key, o `code`/`code_verifier` do OAuth e o JWT de sessao. Registre apenas
metadados: duracoes, contagem de segmentos, codigos de erro, latencias.

---

## Scripts

| Comando | Descricao |
|---|---|
| `npm run start:dev` | Desenvolvimento com watch |
| `npm run build` | Compila para `dist/` |
| `npm run start:prod` | Executa o build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint com `--fix` |
| `npm run format` | Prettier |
