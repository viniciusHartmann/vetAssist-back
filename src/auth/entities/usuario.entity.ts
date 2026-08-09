import { Column, Entity, Index } from 'typeorm';
import { EntidadeBase } from '../../database/entidade-base';

@Entity('usuarios')
export class Usuario extends EntidadeBase {
  /** `sub` do Supabase — chave de ligacao entre a conta OAuth e o usuario local. */
  @Index({ unique: true })
  @Column({ type: 'text' })
  supabaseId: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  email: string;

  @Column({ type: 'text', nullable: true })
  nome: string | null;

  @Column({ type: 'text', nullable: true })
  urlAvatar: string | null;

  @Column({ type: 'text', default: 'google' })
  provedor: string;

  @Column({ type: 'timestamptz', nullable: true })
  ultimoLoginEm: Date | null;

  /** Desativar e mais barato e reversivel que apagar. */
  @Column({ type: 'boolean', default: true })
  ativo: boolean;
}
