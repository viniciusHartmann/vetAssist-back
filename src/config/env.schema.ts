import { z } from 'zod';

/**
 * Fonte unica de verdade das variaveis de ambiente.
 *
 * Regra importante: as variaveis dos modulos ainda nao implementados
 * (Deepgram, AI Gateway) sao OPCIONAIS de proposito. Elas nao podem impedir
 * a aplicacao de subir — os providers correspondentes leem a config dentro
 * dos metodos e falham apenas quando efetivamente chamados.
 */
export const esquemaEnv = z.object({
  // --- Aplicacao ---
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // --- Banco ---
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL e obrigatoria')
    .refine((valor) => valor.startsWith('postgres'), {
      message: 'DATABASE_URL deve comecar com postgres:// ou postgresql://',
    }),
  DATABASE_SSL: z
    .string()
    .default('true')
    .transform((valor) => valor !== 'false'),

  // --- Supabase Auth (OAuth esta no escopo desta entrega -> obrigatorio) ---
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY e obrigatoria'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY e obrigatoria'),

  // --- Sessao ---
  APP_JWT_SECRET: z.string().min(32, 'APP_JWT_SECRET precisa de ao menos 32 caracteres'),
  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET precisa de ao menos 32 caracteres'),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(604_800),
  COOKIE_DOMAIN: z
    .string()
    .optional()
    .transform((valor) => (valor && valor.length > 0 ? valor : undefined)),

  // --- Rate limiting e logs ---
  THROTTLE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // --- Opcionais: modulos nao implementados ---
  DEEPGRAM_API_KEY: z.string().optional(),
  AI_GATEWAY_API_KEY: z.string().optional(),
  AI_GATEWAY_MODEL: z.string().optional(),
  MAX_VISIT_DURATION_SECONDS: z.coerce.number().int().positive().default(3600),
  AUDIO_SAMPLE_RATE: z.coerce.number().int().positive().default(16_000),
});

export type Env = z.infer<typeof esquemaEnv>;

/**
 * Hook `validate` do ConfigModule. Falha o boot com uma lista legivel em vez
 * de deixar a aplicacao subir e quebrar na primeira requisicao.
 */
export function validarEnv(bruto: Record<string, unknown>): Env {
  const resultado = esquemaEnv.safeParse(bruto);

  if (!resultado.success) {
    const linhas = resultado.error.issues.map(
      (problema) => `  - ${problema.path.join('.')}: ${problema.message}`,
    );
    throw new Error(`Configuracao invalida:\n${linhas.join('\n')}`);
  }

  return resultado.data;
}
