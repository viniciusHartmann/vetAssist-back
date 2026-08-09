import { Column, Entity, Index, ManyToMany } from 'typeorm';
import { EntidadeBase } from '../../database/entidade-base';
import { Patologia } from './patologia.entity';

/**
 * Catalogo global de tratamentos, compartilhado por todos os usuarios. Mesmo
 * racional do SinalClinico: sem dono, N:N com patologias via
 * `patologias_tratamentos`.
 *
 * `descricao` guarda a observacao de como o tratamento funciona. Ela pertence
 * ao tratamento em si, nao ao vinculo: fluidoterapia funciona igual em
 * qualquer quadro. Se um dia for preciso anotar algo especifico da patologia
 * ("neste caso, por 3 dias"), a juncao precisa virar uma entity propria com
 * coluna extra — `@ManyToMany` do TypeORM nao suporta payload na juncao.
 *
 * Unicidade case-insensitive por `uq_tratamentos_nome` (`UNIQUE (lower(nome))`)
 * criado na migration; ver a nota em sinal-clinico.entity.ts.
 */
@Index('uq_tratamentos_nome', { synchronize: false })
@Entity('tratamentos')
export class Tratamento extends EntidadeBase {
  @Column({ type: 'text' })
  nome: string;

  @Column({ type: 'text', default: '' })
  descricao: string;

  /** Lado inverso; a tabela de juncao e declarada em Patologia. */
  @ManyToMany(() => Patologia, (patologia) => patologia.tratamentos)
  patologias: Patologia[];
}
