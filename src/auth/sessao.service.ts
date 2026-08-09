import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { CookieOptions } from 'express';
import type { Env } from '../config/env.schema';
import { NaoAutenticadoException } from '../common/errors/excecoes';
import type { PayloadSessao } from './tipos/sessao.type';

function base64UrlEncode(dados: Buffer | string): string {
  return Buffer.from(dados)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(texto: string): Buffer {
  return Buffer.from(texto.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/**
 * Emissao e verificacao do JWT HS256 proprio da aplicacao.
 *
 * Implementado com node:crypto em vez de @nestjs/jwt — e um unico uso e evita
 * mais uma dependencia. O token do Supabase NAO e guardado: o Google serve
 * apenas como identidade no login, entao nao ha refresh token para proteger.
 */
@Injectable()
export class SessaoService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  private get segredo(): string {
    return this.config.get('APP_JWT_SECRET', { infer: true });
  }

  private assinar(conteudo: string): string {
    return base64UrlEncode(createHmac('sha256', this.segredo).update(conteudo).digest());
  }

  emitir(usuarioId: string): { token: string; expiraEm: number } {
    const ttl = this.config.get('SESSION_TTL_SECONDS', { infer: true });
    const agora = Math.floor(Date.now() / 1000);

    const payload: PayloadSessao = {
      sub: usuarioId,
      sid: randomUUID(),
      iat: agora,
      exp: agora + ttl,
    };

    const cabecalho = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const corpo = base64UrlEncode(JSON.stringify(payload));
    const assinatura = this.assinar(`${cabecalho}.${corpo}`);

    return { token: `${cabecalho}.${corpo}.${assinatura}`, expiraEm: payload.exp };
  }

  verificar(token: string): PayloadSessao {
    const partes = token.split('.');
    if (partes.length !== 3) {
      throw new NaoAutenticadoException();
    }

    const [cabecalho, corpo, assinatura] = partes;
    const esperada = this.assinar(`${cabecalho}.${corpo}`);

    // Comparacao em tempo constante evita vazar a assinatura por timing.
    const recebidaBuf = Buffer.from(assinatura);
    const esperadaBuf = Buffer.from(esperada);
    if (recebidaBuf.length !== esperadaBuf.length || !timingSafeEqual(recebidaBuf, esperadaBuf)) {
      throw new NaoAutenticadoException();
    }

    let payload: PayloadSessao;
    try {
      payload = JSON.parse(base64UrlDecode(corpo).toString('utf8')) as PayloadSessao;
    } catch {
      throw new NaoAutenticadoException();
    }

    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') {
      throw new NaoAutenticadoException();
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new NaoAutenticadoException('Sessao expirada.');
    }

    return payload;
  }

  /**
   * Expiracao deslizante: se passou mais da metade do TTL, vale reemitir o
   * cookie para que o usuario ativo nunca seja deslogado no meio do uso.
   */
  precisaRenovar(payload: PayloadSessao): boolean {
    const ttl = this.config.get('SESSION_TTL_SECONDS', { infer: true });
    const agora = Math.floor(Date.now() / 1000);
    return payload.exp - agora < ttl / 2;
  }

  /**
   * Flags do cookie de sessao.
   *
   * `secure` fica desligado em desenvolvimento — com ele ligado o navegador
   * descarta o cookie em http://localhost e o login "nao funciona" sem erro.
   *
   * ATENCAO: `sameSite: 'lax'` funciona hoje porque :3000 e :4000 sao o mesmo
   * site e o redirect do Google e top-level. Se o backend for para outro
   * dominio que nao o do frontend, isto PRECISA virar 'none' + secure: true.
   */
  opcoesCookie(maxAgeSegundos?: number): CookieOptions {
    const producao = this.config.get('NODE_ENV', { infer: true }) === 'production';
    const ttl: number =
      maxAgeSegundos ?? this.config.get('SESSION_TTL_SECONDS', { infer: true });

    return {
      httpOnly: true,
      secure: producao,
      sameSite: 'lax',
      path: '/',
      domain: this.config.get('COOKIE_DOMAIN', { infer: true }),
      maxAge: ttl * 1000,
    };
  }

  /** Mesmas flags sem maxAge — necessario para o clear funcionar. */
  opcoesLimpeza(): CookieOptions {
    const { maxAge: _maxAge, ...resto } = this.opcoesCookie();
    return resto;
  }
}
