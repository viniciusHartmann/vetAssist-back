import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { NaoEncontradoException, ValidacaoException } from '../common/errors/excecoes';
import {
  AtualizarPatologiaDto,
  CriarPatologiaDto,
  ListarPatologiasDto,
} from './dto/patologia.dto';
import { Especie, Patologia } from './entities/patologia.entity';

/**
 * Gancho de multi-tenant.
 *
 * Hoje o catalogo de patologias e compartilhado entre todos os usuarios, mas
 * o `usuarioId` ja e gravado na criacao e ja circula por todos os metodos.
 * Virar esta flag para `true` (ou liga-la a uma env) ativa o isolamento sem
 * mudar nenhuma chamada nos controllers.
 */
const ISOLAMENTO_ATIVO = false;

@Injectable()
export class PatologiasService {
  constructor(
    @InjectRepository(Patologia)
    private readonly patologias: Repository<Patologia>,
  ) {}

  private aplicarEscopo(
    query: SelectQueryBuilder<Patologia>,
    usuarioId: string,
  ): SelectQueryBuilder<Patologia> {
    if (!ISOLAMENTO_ATIVO) {
      return query;
    }

    return query.andWhere(
      '(patologia.usuarioId = :usuarioId OR patologia.usuarioId IS NULL)',
      { usuarioId },
    );
  }

  async listar(filtros: ListarPatologiasDto, usuarioId: string): Promise<Patologia[]> {
    const query = this.patologias
      .createQueryBuilder('patologia')
      .leftJoinAndSelect('patologia.sinais', 'sinal')
      .leftJoinAndSelect('patologia.tratamentos', 'tratamento');

    if (filtros.busca) {
      query.andWhere('(patologia.nome ILIKE :busca OR patologia.descricao ILIKE :busca)', {
        busca: `%${filtros.busca}%`,
      });
    }

    if (filtros.especie) {
      // Uma patologia marcada como "ambos" e relevante tambem para cao e gato.
      if (filtros.especie === Especie.AMBOS) {
        query.andWhere('patologia.especie = :especie', { especie: Especie.AMBOS });
      } else {
        query.andWhere('patologia.especie IN (:...especies)', {
          especies: [filtros.especie, Especie.AMBOS],
        });
      }
    }

    this.aplicarEscopo(query, usuarioId);

    return query.orderBy('patologia.nome', 'ASC').getMany();
  }

  async buscarPorId(id: string, usuarioId: string): Promise<Patologia> {
    const query = this.patologias
      .createQueryBuilder('patologia')
      .leftJoinAndSelect('patologia.sinais', 'sinal')
      .leftJoinAndSelect('patologia.tratamentos', 'tratamento')
      .where('patologia.id = :id', { id });

    this.aplicarEscopo(query, usuarioId);

    const patologia = await query.getOne();

    if (!patologia) {
      throw new NaoEncontradoException('Patologia nao encontrada.');
    }

    return patologia;
  }

  async criar(dados: CriarPatologiaDto, usuarioId: string): Promise<Patologia> {
    const patologia = this.patologias.create({
      nome: dados.nome,
      especie: dados.especie,
      descricao: dados.descricao ?? '',
      usuarioId,
    });

    const salva = await this.patologias.save(patologia);

    return this.buscarPorId(salva.id, usuarioId);
  }

  async atualizar(
    id: string,
    dados: AtualizarPatologiaDto,
    usuarioId: string,
  ): Promise<Patologia> {
    if (Object.keys(dados).length === 0) {
      throw new ValidacaoException('Informe ao menos um campo para atualizar.');
    }

    const patologia = await this.buscarPorId(id, usuarioId);

    if (dados.nome !== undefined) patologia.nome = dados.nome;
    if (dados.especie !== undefined) patologia.especie = dados.especie;
    if (dados.descricao !== undefined) patologia.descricao = dados.descricao;

    await this.patologias.save(patologia);

    return this.buscarPorId(id, usuarioId);
  }

  async remover(id: string, usuarioId: string): Promise<{ sucesso: true }> {
    // Confirma a existencia (e o escopo) antes de apagar; os filhos saem por
    // ON DELETE CASCADE no banco.
    await this.buscarPorId(id, usuarioId);
    await this.patologias.delete({ id });

    return { sucesso: true };
  }

  /** Usado pelos services filhos para validar o pai antes de qualquer escrita. */
  async garantirExistencia(id: string, usuarioId: string): Promise<Patologia> {
    return this.buscarPorId(id, usuarioId);
  }
}
