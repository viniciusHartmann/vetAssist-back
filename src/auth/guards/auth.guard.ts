import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { NaoAutenticadoException } from '../../common/errors/excecoes';
import { definirUsuarioAtual } from '../../common/request-context/request-context';
import { AuthService } from '../auth.service';
import { ROTA_PUBLICA } from '../decorators/publico.decorator';
import type { RequisicaoAutenticada } from '../decorators/usuario-atual.decorator';
import { SessaoService } from '../sessao.service';
import { COOKIE_SESSAO } from '../tipos/sessao.type';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessao: SessaoService,
    private readonly auth: AuthService,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    if (contexto.getType() !== 'http') {
      return true;
    }

    const publica = this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (publica) {
      return true;
    }

    const requisicao = contexto.switchToHttp().getRequest<RequisicaoAutenticada>();
    const token = (requisicao.cookies as Record<string, string> | undefined)?.[COOKIE_SESSAO];

    if (!token) {
      throw new NaoAutenticadoException('Autenticacao necessaria.');
    }

    const payload = this.sessao.verificar(token);
    const usuario = await this.auth.buscarPorId(payload.sub);

    if (!usuario) {
      throw new NaoAutenticadoException();
    }

    requisicao.usuario = usuario;
    definirUsuarioAtual(usuario.id);

    // Expiracao deslizante: usuario ativo nunca e deslogado no meio do uso.
    if (this.sessao.precisaRenovar(payload)) {
      const { token: novoToken } = this.sessao.emitir(usuario.id);
      const resposta = contexto.switchToHttp().getResponse<Response>();
      resposta.cookie(COOKIE_SESSAO, novoToken, this.sessao.opcoesCookie());
    }

    return true;
  }
}
