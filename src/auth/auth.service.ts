import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppException } from '../common/errors/excecoes';
import { CodigoErro } from '../common/errors/codigos-erro';
import { HttpStatus } from '@nestjs/common';
import { Usuario } from './entities/usuario.entity';
import { SupabaseClientProvider } from './supabase.client';

interface UsuarioSupabase {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabase: SupabaseClientProvider,
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
  ) {}

  /**
   * Monta a URL de autorizacao do Google via Supabase.
   *
   * IMPORTANTE: nao passe `state` nem `code_challenge` proprios aqui. Neste
   * fluxo quem e o cliente OAuth perante o Google e o SUPABASE, nao este
   * backend — ele gera o proprio `state` (um JWT) e o valida no retorno. Um
   * `state` nosso na URL colide com o dele e o login falha com
   * `bad_oauth_state` antes mesmo de chegar ao nosso callback.
   *
   * O `code_verifier` do PKCE e gerado pelo SDK e devolvido aqui para o
   * controller guardar no cookie: a troca do codigo acontece em outra
   * requisicao e precisa do mesmo verifier.
   */
  async montarUrlGoogle(urlCallback: string): Promise<{ url: string; codeVerifier: string }> {
    const { cliente, storage } = this.supabase.criar();

    const { data, error } = await cliente.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: urlCallback,
        scopes: 'email profile',
        skipBrowserRedirect: true,
      },
    });

    const codeVerifier = storage.obterVerifier();

    if (error || !data?.url || !codeVerifier) {
      this.logger.warn(
        { erro: error?.message, temUrl: Boolean(data?.url), temVerifier: Boolean(codeVerifier) },
        'Falha ao montar a URL de autorizacao do Google',
      );
      throw new AppException(
        CodigoErro.NAO_AUTENTICADO,
        'Nao foi possivel iniciar o login com o Google.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return { url: data.url, codeVerifier };
  }

  /** Troca o `code` do callback pela identidade do usuario no Supabase. */
  async trocarCodigoPorUsuario(codigo: string, codeVerifier: string): Promise<UsuarioSupabase> {
    // O verifier volta do cookie para o storage: e o que liga esta requisicao
    // a que montou a URL de autorizacao.
    const { cliente } = this.supabase.criar(codeVerifier);

    const { data, error } = await cliente.exchangeCodeForSession(codigo);

    if (error || !data?.user) {
      // Log sem o codigo nem o verifier — sao credenciais de uso unico.
      this.logger.warn(
        { erro: error?.message, status: error?.status },
        'Falha ao trocar codigo OAuth por sessao',
      );
      throw new AppException(
        CodigoErro.NAO_AUTENTICADO,
        'Nao foi possivel concluir o login com o Google.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return data.user;
  }

  /**
   * Cria o usuario no primeiro login ou atualiza os dados de perfil nos
   * seguintes. A chave de ligacao e o `supabaseId`, nao o email — email pode
   * mudar no provedor.
   */
  async sincronizarUsuario(usuarioSupabase: UsuarioSupabase): Promise<Usuario> {
    const email = usuarioSupabase.email?.trim().toLowerCase();

    if (!email) {
      throw new AppException(
        CodigoErro.NAO_AUTENTICADO,
        'A conta Google nao possui um email utilizavel.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const metadados = usuarioSupabase.user_metadata ?? {};
    const nome = metadados.full_name ?? metadados.name ?? null;
    const urlAvatar = metadados.avatar_url ?? metadados.picture ?? null;

    const existente = await this.usuarios.findOne({
      where: { supabaseId: usuarioSupabase.id },
    });

    if (existente) {
      existente.email = email;
      existente.nome = nome;
      existente.urlAvatar = urlAvatar;
      existente.ultimoLoginEm = new Date();
      return this.usuarios.save(existente);
    }

    const novo = this.usuarios.create({
      supabaseId: usuarioSupabase.id,
      email,
      nome,
      urlAvatar,
      provedor: 'google',
      ultimoLoginEm: new Date(),
      ativo: true,
    });

    try {
      return await this.usuarios.save(novo);
    } catch (erro) {
      // Corrida entre duas abas logando ao mesmo tempo: a unique de supabase_id
      // dispara e a segunda tentativa vira uma leitura.
      const jaCriado = await this.usuarios.findOne({
        where: { supabaseId: usuarioSupabase.id },
      });

      if (jaCriado) {
        return jaCriado;
      }

      throw erro;
    }
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.usuarios.findOne({ where: { id, ativo: true } });
  }
}
