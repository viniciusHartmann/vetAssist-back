import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthClient } from '@supabase/auth-js';
import type { Env } from '../config/env.schema';

/** Sufixo da chave onde o supabase-js grava o verifier (`${storageKey}-code-verifier`). */
const SUFIXO_VERIFIER = '-code-verifier';

/** `AuthClient` e exportado como valor; o tipo da instancia vem daqui. */
type ClienteAuth = InstanceType<typeof AuthClient>;

/**
 * Storage em memoria para o fluxo PKCE do SDK.
 *
 * O SDK grava o `code_verifier` aqui ao montar a URL de autorizacao e o le de
 * volta na troca do codigo. Como as duas etapas sao requisicoes HTTP distintas,
 * nada sobrevive entre elas por conta propria: quem carrega o verifier de uma
 * para a outra e o cookie `va_oauth`, no controller.
 *
 * Por isso o storage e por requisicao, e NAO um singleton — dois logins
 * simultaneos nao podem enxergar o verifier um do outro.
 */
class StorageMemoria {
  private readonly dados = new Map<string, string>();

  /**
   * O verifier do cookie chega antes de sabermos a `storageKey` que o SDK vai
   * usar (ela deriva do ref do projeto). Guardamos o valor a parte e o
   * entregamos no primeiro `getItem` de uma chave `*-code-verifier`.
   */
  constructor(private readonly verifierInicial?: string | null) {}

  private static ehChaveVerifier(chave: string): boolean {
    return chave.endsWith(SUFIXO_VERIFIER);
  }

  getItem(chave: string): string | null {
    const armazenado = this.dados.get(chave);
    if (armazenado !== undefined) {
      return armazenado;
    }

    if (this.verifierInicial && StorageMemoria.ehChaveVerifier(chave)) {
      return this.verifierInicial;
    }

    return null;
  }

  setItem(chave: string, valor: string): void {
    this.dados.set(chave, valor);
  }

  removeItem(chave: string): void {
    this.dados.delete(chave);
  }

  /** O verifier que o SDK gravou ao montar a URL de autorizacao. */
  obterVerifier(): string | null {
    for (const [chave, valor] of this.dados) {
      if (StorageMemoria.ehChaveVerifier(chave)) {
        return valor;
      }
    }

    return null;
  }
}

/**
 * Cliente de autenticacao do Supabase.
 *
 * Usa `AuthClient` do @supabase/auth-js, e NAO o `createClient` do
 * @supabase/supabase-js. Motivo: `createClient` instancia o RealtimeClient
 * junto, que exige WebSocket nativo — inexistente no Node 20 (so a partir do
 * 22). Isso derrubava a rota inteira com 500 antes de qualquer logica de auth.
 * Aqui so precisamos de auth, entao o client especifico e o certo.
 *
 * Usa a ANON key: a troca de codigo OAuth nao precisa de service role, e essa
 * chave nao deve circular onde a anon resolve.
 *
 * ATENCAO ao `persistSession: true`: parece contra-intuitivo num backend, mas e
 * obrigatorio. O SDK so honra o `storage` custom quando persistSession esta
 * ligado — com `false` ele ignora o que passamos e usa um storage interno
 * (GoTrueClient.js:222-242), deixando o `code_verifier` inacessivel.
 *
 * Nao ha risco de vazar sessao entre usuarios: o storage e uma instancia nova
 * por requisicao, em memoria, e `autoRefreshToken` fica desligado. O token do
 * Supabase e descartado apos a troca — a sessao da aplicacao e o JWT proprio
 * emitido pelo SessaoService.
 */
@Injectable()
export class SupabaseClientProvider {
  constructor(private readonly config: ConfigService<Env, true>) {}

  /**
   * Cria um client isolado, com storage proprio.
   *
   * @param verifier verifier vindo do cookie, na etapa de callback.
   * @returns o client e o storage — o storage e como o controller recupera o
   *          verifier gerado para grava-lo no cookie.
   */
  criar(verifier?: string | null): { cliente: ClienteAuth; storage: StorageMemoria } {
    const storage = new StorageMemoria(verifier);
    const anonKey = this.config.get('SUPABASE_ANON_KEY', { infer: true });

    const cliente = new AuthClient({
      url: `${this.config.get('SUPABASE_URL', { infer: true })}/auth/v1`,
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: 'pkce',
      storage,
    });

    return { cliente, storage };
  }
}

export type { StorageMemoria };
