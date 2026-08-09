import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflitoException,
  NaoEncontradoException,
  ValidacaoException,
} from '../common/errors/excecoes';
import { chaveDedup } from '../common/transformacoes';
import {
  AtualizarTratamentoDto,
  CriarTratamentoDto,
  ListarTratamentosDto,
} from './dto/tratamento.dto';
import { Tratamento } from './entities/tratamento.entity';

const LIMITE_PADRAO = 20;

/**
 * Catalogo global de tratamentos, compartilhado por todos os usuarios. Mesmo
 * racional de SinaisService: sem dono, e independente de qualquer patologia.
 */
@Injectable()
export class TratamentosService {
  constructor(
    @InjectRepository(Tratamento)
    private readonly tratamentos: Repository<Tratamento>,
  ) {}

  async listar(filtros: ListarTratamentosDto): Promise<Tratamento[]> {
    const query = this.tratamentos.createQueryBuilder('tratamento');

    if (filtros.busca) {
      query.where('tratamento.nome ILIKE :busca', { busca: `%${filtros.busca}%` });
    }

    return query
      .orderBy('tratamento.nome', 'ASC')
      .take(filtros.limite ?? LIMITE_PADRAO)
      .getMany();
  }

  async buscarPorId(id: string): Promise<Tratamento> {
    const tratamento = await this.tratamentos.findOne({ where: { id } });

    if (!tratamento) {
      throw new NaoEncontradoException('Tratamento nao encontrado.');
    }

    return tratamento;
  }

  /**
   * Nome ja existente devolve o existente, e a observacao enviada e
   * descartada: sobrescrever mudaria em silencio o texto que outras patologias
   * ja exibem. Editar a observacao e acao explicita via PATCH /tratamentos/:id.
   */
  async criar(dados: CriarTratamentoDto): Promise<Tratamento> {
    const existente = await this.buscarPorNome(dados.nome);

    if (existente) {
      return existente;
    }

    const tratamento = this.tratamentos.create({
      nome: dados.nome,
      descricao: dados.descricao ?? '',
    });

    return this.tratamentos.save(tratamento);
  }

  /** Edicao global: reflete em todas as patologias que usam o tratamento. */
  async atualizar(id: string, dados: AtualizarTratamentoDto): Promise<Tratamento> {
    if (Object.keys(dados).length === 0) {
      throw new ValidacaoException('Informe ao menos um campo para atualizar.');
    }

    const tratamento = await this.buscarPorId(id);

    if (dados.nome !== undefined) {
      const colidindo = await this.buscarPorNome(dados.nome);

      if (colidindo && colidindo.id !== id) {
        throw new ConflitoException('Ja existe um tratamento com este nome.');
      }

      tratamento.nome = dados.nome;
    }

    if (dados.descricao !== undefined) tratamento.descricao = dados.descricao;

    return this.tratamentos.save(tratamento);
  }

  /** Ver a nota em SinaisService.remover sobre o bloqueio sem `forcar`. */
  async remover(id: string, forcar = false): Promise<{ sucesso: true }> {
    const tratamento = await this.tratamentos.findOne({
      where: { id },
      relations: { patologias: true },
    });

    if (!tratamento) {
      throw new NaoEncontradoException('Tratamento nao encontrado.');
    }

    const vinculos = tratamento.patologias?.length ?? 0;

    if (vinculos > 0 && !forcar) {
      throw new ConflitoException(
        `Este tratamento esta vinculado a ${vinculos} patologia(s). ` +
          'Desvincule antes de excluir ou confirme a exclusao em cascata.',
      );
    }

    await this.tratamentos.delete({ id });

    return { sucesso: true };
  }

  private async buscarPorNome(nome: string): Promise<Tratamento | null> {
    return this.tratamentos
      .createQueryBuilder('tratamento')
      .where('lower(tratamento.nome) = :chave', { chave: chaveDedup(nome) })
      .getOne();
  }
}
