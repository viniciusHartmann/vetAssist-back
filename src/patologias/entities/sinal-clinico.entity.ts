import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Patologia } from './patologia.entity';

@Entity('sinais_clinicos')
export class SinalClinico {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  patologiaId: string;

  @ManyToOne(() => Patologia, (patologia) => patologia.sinais, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patologia_id' })
  patologia: Patologia;

  @Column({ type: 'text' })
  descricao: string;

  @CreateDateColumn({ type: 'timestamptz' })
  criadoEm: Date;
}
