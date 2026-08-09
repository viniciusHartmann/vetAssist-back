import { Controller, Get, HttpCode, HttpStatus, Logger, Post, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { Env } from '../config/env.schema';
import { SemEnvelope } from '../common/envelope/sem-envelope.decorator';
import { AuthService } from './auth.service';
import { Publico } from './decorators/publico.decorator';
import { UsuarioAtual } from './decorators/usuario-atual.decorator';
import type { Usuario } from './entities/usuario.entity';
import { SessaoService } from './sessao.service';
import { UsuarioAtualDto, paraUsuarioAtualDto } from './dto/usuario-atual.dto';
import { COOKIE_OAUTH, COOKIE_SESSAO } from './tipos/sessao.type';

/** O cookie do code_verifier so precisa sobreviver ao ida-e-volta do Google. */
const TTL_ESTADO_OAUTH_SEGUNDOS = 600;

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly sessao: SessaoService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private get urlCallback(): string {
    const porta = this.config.get('PORT', { infer: true });
    return `http://localhost:${porta}/auth/google/callback`;
  }

  private get urlFrontend(): string {
    return this.config.get('FRONTEND_URL', { infer: true });
  }

  /**
   * Consumido por components/auth/LoginButton.tsx, que espera exatamente
   * `{ url: string }` dentro de `data`.
   */
  @Publico()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Get('google/url')
  async obterUrlGoogle(@Res({ passthrough: true }) resposta: Response): Promise<{ url: string }> {
    const { url, codeVerifier } = await this.auth.montarUrlGoogle(this.urlCallback);

    // Guarda so o code_verifier do PKCE. O `state` e responsabilidade do
    // Supabase — ver o comentario em AuthService.montarUrlGoogle.
    resposta.cookie(COOKIE_OAUTH, codeVerifier, {
      ...this.sessao.opcoesCookie(TTL_ESTADO_OAUTH_SEGUNDOS),
      signed: true,
    });

    resposta.setHeader('Cache-Control', 'no-store');

    return { url };
  }

  /**
   * Callback do OAuth. Responde SEMPRE com redirect — o frontend nao tem uma
   * pagina /auth/callback, entao nada aqui pode renderizar corpo.
   */
  @Publico()
  @SemEnvelope()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Get('google/callback')
  async callbackGoogle(
    @Query('code') codigo: string | undefined,
    @Query('error') erroProvedor: string | undefined,
    @Req() requisicao: Request,
    @Res() resposta: Response,
  ): Promise<void> {
    const limparEstado = () => resposta.clearCookie(COOKIE_OAUTH, this.sessao.opcoesLimpeza());

    const falhar = (motivo: string) => {
      this.logger.warn({ motivo }, 'Callback do OAuth interrompido');
      limparEstado();
      resposta.redirect(`${this.urlFrontend}/?erro=state_invalido`);
    };

    try {
      // cookie-parser grava `false` (nao `undefined`) quando a assinatura nao valida.
      const assinados = requisicao.signedCookies as Record<string, unknown> | undefined;
      const valorCookie = assinados?.[COOKIE_OAUTH];
      const codeVerifier = typeof valorCookie === 'string' ? valorCookie : null;

      // O Supabase pode devolver o erro dele na query (ex.: bad_oauth_state).
      // Sem isto o motivo real ficaria mascarado como "codigo ausente".
      if (erroProvedor) {
        falhar(`provedor retornou erro: ${erroProvedor}`);
        return;
      }

      if (!codigo) {
        falhar('codigo ausente na query');
        return;
      }

      if (!codeVerifier) {
        falhar(
          valorCookie === false
            ? 'cookie do code_verifier com assinatura invalida'
            : 'cookie do code_verifier ausente ou expirado',
        );
        return;
      }

      const usuarioSupabase = await this.auth.trocarCodigoPorUsuario(codigo, codeVerifier);
      const usuario = await this.auth.sincronizarUsuario(usuarioSupabase);
      const { token } = this.sessao.emitir(usuario.id);

      limparEstado();
      resposta.cookie(COOKIE_SESSAO, token, this.sessao.opcoesCookie());
      // O `?login=sucesso` alimenta o toast de confirmacao no frontend, que limpa
      // a query em seguida (components/auth/AvisoErroLogin.tsx).
      resposta.redirect(`${this.urlFrontend}/?login=sucesso`);
    } catch (erro) {
      // O erro do provedor fica no log; a query string nunca o expoe.
      this.logger.warn({ err: erro }, 'Falha no callback do OAuth');
      limparEstado();
      resposta.redirect(`${this.urlFrontend}/?erro=auth_falhou`);
    }
  }

  /**
   * Retorna 401 quando nao ha sessao (nao 200 com null): useCurrentUser usa
   * `retry: false` e trata o throw como "deslogado".
   */
  @Get('me')
  obterUsuarioAtual(@UsuarioAtual() usuario: Usuario): UsuarioAtualDto {
    return paraUsuarioAtualDto(usuario);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  sair(@Res({ passthrough: true }) resposta: Response): { sucesso: true } {
    // As flags precisam bater com as da emissao, senao o clear falha calado.
    resposta.clearCookie(COOKIE_SESSAO, this.sessao.opcoesLimpeza());
    return { sucesso: true };
  }
}
