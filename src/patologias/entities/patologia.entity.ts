import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { EntidadeBase } from '../../database/entidade-base';
import { Usuario } from '../../auth/entities/usuario.entity';
import { SinalClinico } from './sinal-clinico.entity';
import { Tratamento } from './tratamento.entity';

export enum Especie {
  CAO = 'cao',
  GATO = 'gato',
  AMBOS = 'ambos',
}

@Entity('patologias')
export class Patologia extends EntidadeBase {
  @Index()
  @Column({ type: 'text' })
  nome: string;

  @Index()
  @Column({ type: 'text' })
  especie: Especie;

  @Column({ type: 'text', default: '' })
  descricao: string;

  /**
   * Gancho de multi-tenant: gravado na criacao, mas ainda nao usado para
   * filtrar (o catalogo e compartilhado). Ver ISOLAMENTO_ATIVO no service.
   */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  usuarioId: string | null;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario | null;

  /**
   * Patologia e o lado dono das duas relacoes N:N.
   *
   * Os nomes de tabela e coluna sao declarados explicitamente pelo mesmo motivo
   * que `@Entity('...')` declara o nome da tabela: o que a naming strategy
   * geraria (`patologias_sinais_sinais_clinicos`, coluna `patologias_id`) e
   * ilegivel e no plural, contradizendo o `usuario_id` do resto do schema.
   */
  @ManyToMany(() => SinalClinico, (sinal) => sinal.patologias)
  @JoinTable({
    name: 'patologias_sinais',
    joinColumn: { name: 'patologia_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'sinal_id', referencedColumnName: 'id' },
  })
  sinais: SinalClinico[];

  @ManyToMany(() => Tratamento, (tratamento) => tratamento.patologias)
  @JoinTable({
    name: 'patologias_tratamentos',
    joinColumn: { name: 'patologia_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tratamento_id', referencedColumnName: 'id' },
  })
  tratamentos: Tratamento[];
}
