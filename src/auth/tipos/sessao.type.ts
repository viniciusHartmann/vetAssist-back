/**
 * Conteudo do cookie de sessao.
 *
 * Deliberadamente minimo: sem email, sem nome, sem token do Supabase. Os dados
 * do usuario vem da tabela `usuarios` a cada requisicao, entao alterar o perfil
 * nao exige reemitir o cookie.
 *
 * `sid` existe para permitir revogacao por sessao no futuro (uma tabela de
 * sessoes revogadas) sem precisar mudar o formato do cookie.
 */
export interface PayloadSessao {
  sub: string;
  sid: string;
  iat: number;
  exp: number;
}

export const COOKIE_SESSAO = 'va_sessao';

/**
 * Cookie temporario que carrega o `code_verifier` do PKCE entre a montagem da
 * URL de autorizacao e a troca do codigo — sao requisicoes distintas.
 *
 * NAO guarda `state`: o state do fluxo e gerado e validado pelo Supabase, que e
 * o cliente OAuth perante o Google (ver AuthService.montarUrlGoogle).
 */
export const COOKIE_OAUTH = 'va_oauth';
