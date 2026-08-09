import { Column, Entity, Index, ManyToMany } from 'typeorm';
import { EntidadeBase } from '../../database/entidade-base';
import { Patologia } from './patologia.entity';

/**
 * Catalogo global de sinais clinicos, compartilhado por todos os usuarios.
 *
 * Um sinal e generico ("Vomito frequente" significa o mesmo para qualquer
 * veterinario), entao nao tem dono: nao ha `usuarioId` aqui de proposito. Ja a
 * Patologia e isolada por usuario — ver ISOLAMENTO_ATIVO em patologias.service.
 *
 * A relacao com Patologia e N:N via `patologias_sinais`: o mesmo sinal serve
 * gastroenterite e intoxicacao.
 *
 * Unicidade case-insensitive pelo indice funcional
 * `uq_sinais_clinicos_descricao` (`UNIQUE (lower(descricao))`) criado na
 * migration: a coluna preserva a escrita original digitada, mas "vomito
 * frequente" nao entra como segunda linha ao lado de "Vomito frequente". O
 * TypeORM nao sabe expressar indice sobre expressao, entao o
 * `synchronize: false` impede que ele tente recriar (ou dropar) esse indice.
 */
@Index('uq_sinais_clinicos_descricao', { synchronize: false })
@Entity('sinais_clinicos')
export class SinalClinico extends EntidadeBase {
  @Column({ type: 'text' })
  descricao: string;

  /** Lado inverso; a tabela de juncao e declarada em Patologia. */
  @ManyToMany(() => Patologia, (patologia) => patologia.sinais)
  patologias: Patologia[];
}
