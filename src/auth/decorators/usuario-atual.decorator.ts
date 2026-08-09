import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import type { Usuario } from '../entities/usuario.entity';

export type RequisicaoAutenticada = Request & { usuario?: Usuario };

/**
 * Injeta o usuario autenticado (ou uma propriedade dele).
 *
 * Uso: `@UsuarioAtual() usuario: Usuario` ou `@UsuarioAtual('id') id: string`.
 */
export const UsuarioAtual = createParamDecorator(
  (propriedade: keyof Usuario | undefined, contexto: ExecutionContext) => {
    const requisicao = contexto.switchToHttp().getRequest<RequisicaoAutenticada>();
    const usuario = requisicao.usuario;

    if (!usuario) {
      return undefined;
    }

    return propriedade ? usuario[propriedade] : usuario;
  },
);
