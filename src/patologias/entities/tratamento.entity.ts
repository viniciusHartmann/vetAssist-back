import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntidadeBase } from '../../database/entidade-base';
import { Patologia } from './patologia.entity';

@Entity('tratamentos')
export class Tratamento extends EntidadeBase {
  @Index()
  @Column({ type: 'uuid' })
  patologiaId: string;

  @ManyToOne(() => Patologia, (patologia) => patologia.tratamentos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patologia_id' })
  patologia: Patologia;

  @Column({ type: 'text' })
  nome: string;

  @Column({ type: 'text', default: '' })
  descricao: string;
}
