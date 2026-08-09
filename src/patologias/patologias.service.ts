import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { NaoEncontradoException, ValidacaoException } from '../common/errors/excecoes';
import { CatalogoService } from './catalogo.service';
import {
  AtualizarPatologiaDto,
  CriarPatologiaDto,
  ListarPatologiasDto,
} from './dto/patologia.dto';
import { Especie, Patologia } from './entities/patologia.entity';
import { SinalClinico } from './entities/sinal-clinico.entity';
import { Tratamento } from './entities/tratamento.entity';

/**
 * Patologia e isolada por usuario: cada profissional so ve e edita as suas.
 *
 * Diferente dos catalogos de sinais clinicos e tratamentos, que sao globais e
 * compartilhados — um sinal como "Vomito frequente" significa o mesmo para
 * qualquer veterinario, enquanto a leitura de uma patologia muda de
 * profissional para profissional.
 *
 * O isolamento e estrito: `usuarioId = :usuarioId`, sem clausula para registros
 * sem dono. Nao existe catalogo-semente compartilhado de patologias.
 */
const ISOLAMENTO_ATIVO = true;

@Injectable()
export class PatologiasService {
  constructor(
    @InjectRepository(Patologia)
    private readonly patologias: Repository<Patologia>,
    private readonly catalogo: CatalogoService,
  ) {}

  private aplicarEscopo(
    query: SelectQueryBuilder<Patologia>,
    usuarioId: string,
  ): SelectQueryBuilder<Patologia> {
    if (!ISOLAMENTO_ATIVO) {
      return query;
    }

    return query.andWhere('patologia.usuarioId = :usuarioId', { usuarioId });
  }

  /** Base comum de listar/buscar: traz sinais e tratamentos em ordem estavel. */
  private queryComRelacoes(): SelectQueryBuilder<Patologia> {
    return this.patologias
      .createQueryBuilder('patologia')
      .leftJoinAndSelect('patologia.sinais', 'sinal')
      .leftJoinAndSelect('patologia.tratamentos', 'tratamento');
  }

  async listar(filtros: ListarPatologiasDto, usuarioId: string): Promise<Patologia[]> {
    const query = this.queryComRelacoes();

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

    return query
      .orderBy('patologia.nome', 'ASC')
      .addOrderBy('sinal.descricao', 'ASC')
      .addOrderBy('tratamento.nome', 'ASC')
      .getMany();
  }

  async buscarPorId(id: string, usuarioId: string): Promise<Patologia> {
    const query = this.queryComRelacoes().where('patologia.id = :id', { id });

    this.aplicarEscopo(query, usuarioId);

    const patologia = await query
      .orderBy('sinal.descricao', 'ASC')
      .addOrderBy('tratamento.nome', 'ASC')
      .getOne();

    if (!patologia) {
      throw new NaoEncontradoException('Patologia nao encontrada.');
    }

    return patologia;
  }

  async criar(dados: CriarPatologiaDto, usuarioId: string): Promise<Patologia> {
    // Transacao: se resolver os sinais falhar, a patologia nao fica orfa.
    const id = await this.patologias.manager.transaction(async (manager) => {
      const repo = manager.getRepository(Patologia);

      const patologia = repo.create({
        nome: dados.nome,
        especie: dados.especie,
        descricao: dados.descricao ?? '',
        usuarioId,
      });

      patologia.sinais = await this.catalogo.resolverSinais(
        manager,
        dados.sinaisIds ?? [],
        dados.novosSinais ?? [],
      );
      patologia.tratamentos = await this.catalogo.resolverTratamentos(
        manager,
        dados.tratamentosIds ?? [],
        dados.novosTratamentos ?? [],
      );

      // `save()` com as relacoes populadas grava a patologia e as duas juncoes.
      const salva = await repo.save(patologia);

      return salva.id;
    });

    return this.buscarPorId(id, usuarioId);
  }

  async atualizar(
    id: string,
    dados: AtualizarPatologiaDto,
    usuarioId: string,
  ): Promise<Patologia> {
    if (Object.keys(dados).length === 0) {
      throw new ValidacaoException('Informe ao menos um campo para atualizar.');
    }

    await this.patologias.manager.transaction(async (manager) => {
      const repo = manager.getRepository(Patologia);

      // `relations` e obrigatorio: sem a colecao atual carregada o `save()` nao
      // consegue diferenciar o que foi desvinculado do que permaneceu.
      //
      // O `usuarioId` no where nao e redundante: sem ele, qualquer usuario
      // editaria a patologia de outro so adivinhando o id (IDOR).
      const patologia = await repo.findOne({
        where: ISOLAMENTO_ATIVO ? { id, usuarioId } : { id },
        relations: { sinais: true, tratamentos: true },
      });

      if (!patologia) {
        throw new NaoEncontradoException('Patologia nao encontrada.');
      }

      if (dados.nome !== undefined) patologia.nome = dados.nome;
      if (dados.especie !== undefined) patologia.especie = dados.especie;
      if (dados.descricao !== undefined) patologia.descricao = dados.descricao;

      // Substituicao, nao adicao: se veio qualquer um dos dois campos, a lista
      // enviada passa a ser a lista completa (`sinaisIds: []` desvincula tudo).
      // Nao mandar nenhum dos dois preserva os vinculos — a semantica de PATCH
      // continua honesta porque ausencia significa "nao mexa".
      if (dados.sinaisIds !== undefined || dados.novosSinais !== undefined) {
        patologia.sinais = await this.catalogo.resolverSinais(
          manager,
          dados.sinaisIds ?? [],
          dados.novosSinais ?? [],
        );
      }

      if (dados.tratamentosIds !== undefined || dados.novosTratamentos !== undefined) {
        patologia.tratamentos = await this.catalogo.resolverTratamentos(
          manager,
          dados.tratamentosIds ?? [],
          dados.novosTratamentos ?? [],
        );
      }

      await repo.save(patologia);
    });

    return this.buscarPorId(id, usuarioId);
  }

  async remover(id: string, usuarioId: string): Promise<{ sucesso: true }> {
    // Confirma a existencia (e o escopo) antes de apagar. As linhas de juncao
    // saem por ON DELETE CASCADE; os itens de catalogo sobrevivem, porque
    // pertencem ao catalogo global e nao a esta patologia.
    await this.buscarPorId(id, usuarioId);
    await this.patologias.delete({ id });

    return { sucesso: true };
  }

  /** Usado pelos controllers de vinculo para validar o pai antes de escrever. */
  async garantirExistencia(id: string, usuarioId: string): Promise<Patologia> {
    return this.buscarPorId(id, usuarioId);
  }

  async desvincularSinal(
    patologiaId: string,
    sinalId: string,
    usuarioId: string,
  ): Promise<{ sucesso: true }> {
    await this.garantirExistencia(patologiaId, usuarioId);
    await this.removerVinculo('sinais', patologiaId, sinalId);

    return { sucesso: true };
  }

  async desvincularTratamento(
    patologiaId: string,
    tratamentoId: string,
    usuarioId: string,
  ): Promise<{ sucesso: true }> {
    await this.garantirExistencia(patologiaId, usuarioId);
    await this.removerVinculo('tratamentos', patologiaId, tratamentoId);

    return { sucesso: true };
  }

  /**
   * Apaga apenas a linha da tabela de juncao — o item continua no catalogo,
   * disponivel para outras patologias. O relation query builder faz isso sem
   * carregar a colecao inteira.
   */
  private async removerVinculo(
    relacao: 'sinais' | 'tratamentos',
    patologiaId: string,
    itemId: string,
  ): Promise<void> {
    await this.patologias
      .createQueryBuilder()
      .relation(Patologia, relacao)
      .of(patologiaId)
      .remove(itemId);
  }

  async vincularSinal(
    patologiaId: string,
    sinalId: string,
    usuarioId: string,
  ): Promise<Patologia> {
    await this.garantirExistencia(patologiaId, usuarioId);
    await this.adicionarVinculo('sinais', SinalClinico, patologiaId, sinalId, 'Sinal clinico');

    return this.buscarPorId(patologiaId, usuarioId);
  }

  async vincularTratamento(
    patologiaId: string,
    tratamentoId: string,
    usuarioId: string,
  ): Promise<Patologia> {
    await this.garantirExistencia(patologiaId, usuarioId);
    await this.adicionarVinculo(
      'tratamentos',
      Tratamento,
      patologiaId,
      tratamentoId,
      'Tratamento',
    );

    return this.buscarPorId(patologiaId, usuarioId);
  }

  private async adicionarVinculo(
    relacao: 'sinais' | 'tratamentos',
    entidade: typeof SinalClinico | typeof Tratamento,
    patologiaId: string,
    itemId: string,
    rotulo: string,
  ): Promise<void> {
    const existe = await this.patologias.manager.existsBy(entidade, { id: itemId });

    if (!existe) {
      throw new NaoEncontradoException(`${rotulo} nao encontrado no catalogo.`);
    }

    // Idempotente: vincular duas vezes nao deve estourar violacao de PK.
    const jaVinculado = await this.patologias
      .createQueryBuilder()
      .relation(Patologia, relacao)
      .of(patologiaId)
      .loadMany<{ id: string }>();

    if (jaVinculado.some((item) => item.id === itemId)) {
      return;
    }

    await this.patologias
      .createQueryBuilder()
      .relation(Patologia, relacao)
      .of(patologiaId)
      .add(itemId);
  }
}
