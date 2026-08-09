import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export abstract class EntidadeBase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  criadoEm: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  atualizadoEm: Date;
}
