/**
 * Opcoes de conexao compartilhadas entre o modulo do Nest e o DataSource da CLI.
 *
 * Notas sobre o Supabase:
 * - `db.<ref>.supabase.co:5432` e a conexao DIRETA (nao o pooler). Suporta
 *   prepared statements e migrations.
 * - O certificado vem da CA propria do Supabase, entao a validacao estrita
 *   falha com SELF_SIGNED_CERT_IN_CHAIN. Em producao, baixe a CA do painel e
 *   troque por `{ ca, rejectUnauthorized: true }`.
 * - A conexao direta e IPv6-only em algumas redes. Se travar, use o pooler em
 *   modo SESSION. No pooler de TRANSACAO (porta 6543) e preciso desabilitar
 *   prepared statements, senao o pgbouncer quebra.
 */

/**
 * Remove os parametros de SSL da connection string.
 *
 * Necessario porque o `pg-connection-string` interpreta `?sslmode=require`
 * como `verify-full` e essa configuracao SOBREPOE o objeto `ssl` passado por
 * codigo — o resultado e um SELF_SIGNED_CERT_IN_CHAIN mesmo com
 * `rejectUnauthorized: false`. Tirando o parametro da URL, a opcao explicita
 * abaixo volta a mandar.
 */
export function limparParametrosSsl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('sslmode');
    parsed.searchParams.delete('ssl');
    return parsed.toString();
  } catch {
    // URL malformada: deixa passar para o driver reportar o erro real.
    return url;
  }
}

export function montarOpcoesSsl(sslHabilitado: boolean): false | { rejectUnauthorized: boolean } {
  return sslHabilitado ? { rejectUnauthorized: false } : false;
}

export const OPCOES_POOL = {
  max: 10,
  connectionTimeoutMillis: 10_000,
  keepAlive: true,
} as const;
