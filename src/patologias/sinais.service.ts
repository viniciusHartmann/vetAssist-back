import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflitoException,
  NaoEncontradoException,
  ValidacaoException,
} from '../common/errors/excecoes';
import { chaveDedup } from '../common/transformacoes';
import { AtualizarSinalDto, CriarSinalDto, ListarSinaisDto } from './dto/sinal.dto';
import { SinalClinico } from './entities/sinal-clinico.entity';

const LIMITE_PADRAO = 20;

/**
 * Catalogo global de sinais clinicos, compartilhado por todos os usuarios.
 *
 * Sinais sao genericos e nao tem dono: qualquer usuario busca e vincula
 * qualquer sinal. Diferente da Patologia, que e isolada por usuario.
 *
 * Nao depende de PatologiasService: um sinal existe por si so. O vinculo com
 * uma patologia e responsabilidade de PatologiasService (resolver na criacao,
 * vincular/desvincular pelas rotas aninhadas).
 */
@Injectable()
export class SinaisService {
  constructor(
    @InjectRepository(SinalClinico)
    private readonly sinais: Repository<SinalClinico>,
  ) {}

  /** Serve tanto o autocomplete (`busca`) quanto a listagem do catalogo. */
  async listar(filtros: ListarSinaisDto): Promise<SinalClinico[]> {
    const query = this.sinais.createQueryBuilder('sinal');

    if (filtros.busca) {
      query.where('sinal.descricao ILIKE :busca', { busca: `%${filtros.busca}%` });
    }

    return query
      .orderBy('sinal.descricao', 'ASC')
      .take(filtros.limite ?? LIMITE_PADRAO)
      .getMany();
  }

  async buscarPorId(id: string): Promise<SinalClinico> {
    const sinal = await this.sinais.findOne({ where: { id } });

    if (!sinal) {
      throw new NaoEncontradoException('Sinal clinico nao encontrado.');
    }

    return sinal;
  }

  /**
   * Criar um sinal que ja existe devolve o existente em vez de estourar 409:
   * quem esta cadastrando quer ter o sinal disponivel, e ele ja esta.
   */
  async criar(dados: CriarSinalDto): Promise<SinalClinico> {
    const existente = await this.buscarPorDescricao(dados.descricao);

    if (existente) {
      return existente;
    }

    const sinal = this.sinais.create({ descricao: dados.descricao });

    return this.sinais.save(sinal);
  }

  /**
   * A edicao e global: corrigir a escrita aqui muda o texto em todas as
   * patologias que usam este sinal. E o comportamento desejado para um
   * catalogo compartilhado — corrigir um erro de digitacao em um lugar so.
   */
  async atualizar(id: string, dados: AtualizarSinalDto): Promise<SinalClinico> {
    if (Object.keys(dados).length === 0) {
      throw new ValidacaoException('Informe ao menos um campo para atualizar.');
    }

    const sinal = await this.buscarPorId(id);

    if (dados.descricao !== undefined) {
      const colidindo = await this.buscarPorDescricao(dados.descricao);

      if (colidindo && colidindo.id !== id) {
        throw new ConflitoException('Ja existe um sinal clinico com esta descricao.');
      }

      sinal.descricao = dados.descricao;
    }

    return this.sinais.save(sinal);
  }

  /**
   * Sem `forcar`, apagar um sinal em uso e bloqueado com 409.
   *
   * O CASCADE da juncao removeria os vinculos em silencio — correto para a
   * integridade do banco, pessimo para quem clicou achando que estava
   * removendo o sinal de uma patologia so. A contagem vai na mensagem para o
   * front montar a confirmacao sem uma segunda chamada.
   */
  async remover(id: string, forcar = false): Promise<{ sucesso: true }> {
    const sinal = await this.sinais.findOne({
      where: { id },
      relations: { patologias: true },
    });

    if (!sinal) {
      throw new NaoEncontradoException('Sinal clinico nao encontrado.');
    }

    const vinculos = sinal.patologias?.length ?? 0;

    if (vinculos > 0 && !forcar) {
      throw new ConflitoException(
        `Este sinal clinico esta vinculado a ${vinculos} patologia(s). ` +
          'Desvincule antes de excluir ou confirme a exclusao em cascata.',
      );
    }

    await this.sinais.delete({ id });

    return { sucesso: true };
  }

  /** Comparacao case-insensitive, espelhando o indice `uq_*`. */
  private async buscarPorDescricao(descricao: string): Promise<SinalClinico | null> {
    return this.sinais
      .createQueryBuilder('sinal')
      .where('lower(sinal.descricao) = :chave', { chave: chaveDedup(descricao) })
      .getOne();
  }
}
