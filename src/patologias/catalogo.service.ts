import { Injectable } from '@nestjs/common';
import { EntityManager, In, ObjectLiteral, Repository } from 'typeorm';
import { ValidacaoException } from '../common/errors/excecoes';
import { chaveDedup } from '../common/transformacoes';
import { CriarSinalDto } from './dto/sinal.dto';
import { CriarTratamentoDto } from './dto/tratamento.dto';
import { SinalClinico } from './entities/sinal-clinico.entity';
import { Tratamento } from './entities/tratamento.entity';

/** Entidade de catalogo vista pelo algoritmo generico de resolucao. */
interface ItemCatalogo extends ObjectLiteral {
  id: string;
}

/**
 * Resolve a lista final de itens de catalogo (sinais clinicos e tratamentos) a
 * partir de ids ja existentes + objetos novos digitados no formulario.
 *
 * Sempre roda dentro da transacao aberta por PatologiasService: recebe o
 * `EntityManager` da transacao em vez de injetar repositorios proprios.
 */
@Injectable()
export class CatalogoService {
  async resolverSinais(
    manager: EntityManager,
    ids: string[],
    novos: CriarSinalDto[],
  ): Promise<SinalClinico[]> {
    return this.resolver({
      repo: manager.getRepository(SinalClinico),
      alias: 'sinal',
      coluna: 'descricao',
      campoErro: 'sinaisIds',
      rotulo: 'Sinal clinico',
      ids,
      valores: novos.map((novo) => ({
        texto: novo.descricao,
        linha: { descricao: novo.descricao },
      })),
    });
  }

  async resolverTratamentos(
    manager: EntityManager,
    ids: string[],
    novos: CriarTratamentoDto[],
  ): Promise<Tratamento[]> {
    return this.resolver({
      repo: manager.getRepository(Tratamento),
      alias: 'tratamento',
      coluna: 'nome',
      campoErro: 'tratamentosIds',
      rotulo: 'Tratamento',
      ids,
      valores: novos.map((novo) => ({
        texto: novo.nome,
        linha: { nome: novo.nome, descricao: novo.descricao ?? '' },
      })),
    });
  }

  /**
   * Algoritmo comum aos dois catalogos:
   *
   * 1. carrega os ids informados e exige que todos existam;
   * 2. deduplica os novos dentro do proprio payload (primeira escrita vence);
   * 3. reaproveita os que ja existem no catalogo, comparando por
   *    `lower(coluna)` — digitar um sinal que ja existe VINCULA o existente em
   *    vez de estourar 409, porque quem digitou queria vincular, nao cadastrar;
   * 4. insere o restante e re-busca para montar a lista final.
   */
  private async resolver<T extends ItemCatalogo>(params: {
    repo: Repository<T>;
    alias: string;
    coluna: 'descricao' | 'nome';
    campoErro: string;
    rotulo: string;
    ids: string[];
    valores: { texto: string; linha: Record<string, string> }[];
  }): Promise<T[]> {
    const { repo, alias, coluna, campoErro, rotulo, ids, valores } = params;
    const resultado = new Map<string, T>();

    // 1. Ids existentes.
    if (ids.length > 0) {
      const unicos = [...new Set(ids)];
      const encontrados = await repo.find({ where: { id: In(unicos) } as never });

      if (encontrados.length !== unicos.length) {
        const achados = new Set(encontrados.map((item) => item.id));
        const faltantes = unicos.filter((id) => !achados.has(id));

        throw new ValidacaoException(`${rotulo} nao encontrado no catalogo.`, {
          [campoErro]: `Ids invalidos: ${faltantes.join(', ')}`,
        });
      }

      for (const item of encontrados) resultado.set(item.id, item);
    }

    // 2. Dedup dentro do payload: "Vomito" e "vomito " na mesma lista viram um.
    //
    // O texto e aparado aqui (e nao so no DTO) porque este metodo tambem e
    // chamado com dados que nao passaram pelo ValidationPipe. Sem o trim, a
    // linha entraria com espacos nas pontas e o re-fetch do passo 4, que
    // compara contra a chave ja aparada, nao a encontraria.
    const porChave = new Map<string, Record<string, string>>();
    for (const valor of valores) {
      const chave = chaveDedup(valor.texto);
      if (porChave.has(chave)) continue;

      const linha = Object.fromEntries(
        Object.entries(valor.linha).map(([campo, texto]) => [campo, texto.trim()]),
      );
      porChave.set(chave, linha);
    }

    if (porChave.size === 0) return [...resultado.values()];

    // 3. Reaproveitar o que ja existe no catalogo.
    const jaExistem = await repo
      .createQueryBuilder(alias)
      .where(`lower(${alias}.${coluna}) IN (:...chaves)`, { chaves: [...porChave.keys()] })
      .getMany();

    for (const item of jaExistem) {
      porChave.delete(chaveDedup(item[coluna] as string));
      resultado.set(item.id, item);
    }

    // 4. Inserir o que sobrou.
    if (porChave.size > 0) {
      const chavesPendentes = [...porChave.keys()];

      // `orIgnore()` -> ON CONFLICT DO NOTHING. Cobre a corrida entre dois
      // requests criando o mesmo item; sem isso o 23505 viraria 500. Sem
      // conflict_target de proposito: a UNIQUE e sobre expressao (lower(...)),
      // que nao pode ser nomeada como coluna alvo.
      await repo
        .createQueryBuilder()
        .insert()
        .values([...porChave.values()] as never)
        .orIgnore()
        .execute();

      // Re-busca em vez de usar o retorno do insert: pega tanto o que acabou de
      // entrar quanto o que perdeu a corrida e foi ignorado.
      const persistidos = await repo
        .createQueryBuilder(alias)
        .where(`lower(${alias}.${coluna}) IN (:...chaves)`, { chaves: chavesPendentes })
        .getMany();

      for (const item of persistidos) resultado.set(item.id, item);
    }

    return [...resultado.values()];
  }
}
