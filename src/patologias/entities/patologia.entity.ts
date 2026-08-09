import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
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

  @OneToMany(() => SinalClinico, (sinal) => sinal.patologia, { cascade: false })
  sinais: SinalClinico[];

  @OneToMany(() => Tratamento, (tratamento) => tratamento.patologia, { cascade: false })
  tratamentos: Tratamento[];
}
