import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../auth/entities/usuario.entity';

/** Estrutura da analise gerada pela IA (ver ai/analise/analise.schema.ts). */
export interface AnaliseTranscricao {
  patologiasIdentificadas: {
    patologiaId: string | null;
    nome: string;
    confianca: number;
    evidencias: string[];
  }[];
  tratamentosRelacionados: {
    patologiaId: string;
    patologia: string;
    tratamentos: { tratamentoId: string; nome: string }[];
  }[];
  resumo: string;
  alertas: string[];
}

@Entity('transcricoes')
export class Transcricao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  nome: string;

  @Index()
  @Column({ type: 'timestamptz', default: () => 'now()' })
  gravadaEm: Date;

  @Column({ type: 'integer' })
  duracaoSegundos: number;

  @Column({ type: 'text' })
  textoCompleto: string;

  @Column({ type: 'jsonb' })
  analise: AnaliseTranscricao;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  usuarioId: string | null;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario | null;

  @CreateDateColumn({ type: 'timestamptz' })
  criadoEm: Date;
}
