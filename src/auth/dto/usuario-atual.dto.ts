import type { Usuario } from '../entities/usuario.entity';

/**
 * Resposta de GET /auth/me.
 *
 * Campos em portugues, seguindo a convencao do projeto.
 *
 * ATENCAO: o frontend em lib/auth/use-current-user.ts ainda declara
 * `name` / `avatarUrl` (ingles). Precisa ser ajustado para `nome` / `urlAvatar`
 * ou a interface exibira undefined. Ver README.
 */
export interface UsuarioAtualDto {
  id: string;
  email: string;
  nome: string | null;
  urlAvatar: string | null;
}

export function paraUsuarioAtualDto(usuario: Usuario): UsuarioAtualDto {
  return {
    id: usuario.id,
    email: usuario.email,
    nome: usuario.nome,
    urlAvatar: usuario.urlAvatar,
  };
}
