import { DefaultNamingStrategy, NamingStrategyInterface, Table } from 'typeorm';

function paraSnakeCase(texto: string): string {
  return texto
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

function nomeDaTabela(tabelaOuNome: Table | string): string {
  return typeof tabelaOuNome === 'string' ? tabelaOuNome : tabelaOuNome.name;
}

/**
 * Propriedades das entidades ficam em portugues camelCase (`criadoEm`),
 * colunas do banco em portugues snake_case (`criado_em`).
 *
 * Com isso nenhuma entidade precisa repetir `@Column({ name: '...' })`.
 * Os nomes de tabela sao declarados explicitamente em `@Entity('...')`
 * porque a pluralizacao em portugues nao e derivavel.
 */
export class EstrategiaNomeSnakePt extends DefaultNamingStrategy implements NamingStrategyInterface {
  override tableName(nomeAlvo: string, nomeInformado?: string): string {
    return nomeInformado ?? paraSnakeCase(nomeAlvo);
  }

  override columnName(
    nomePropriedade: string,
    nomeInformado: string | undefined,
    prefixosEmbutidos: string[],
  ): string {
    const base = prefixosEmbutidos.concat(nomeInformado ?? nomePropriedade).join('_');
    return paraSnakeCase(base);
  }

  override relationName(nomePropriedade: string): string {
    return paraSnakeCase(nomePropriedade);
  }

  override joinColumnName(nomeRelacao: string, nomeColunaReferenciada: string): string {
    return paraSnakeCase(`${nomeRelacao}_${nomeColunaReferenciada}`);
  }

  override joinTableName(
    nomeTabelaOrigem: string,
    nomeTabelaDestino: string,
    nomePropriedadeOrigem: string,
  ): string {
    return paraSnakeCase(
      `${nomeTabelaOrigem}_${nomePropriedadeOrigem ?? nomeTabelaDestino}_${nomeTabelaDestino}`,
    );
  }

  override joinTableColumnName(
    nomeTabela: string,
    nomePropriedade: string,
    nomeColuna?: string,
  ): string {
    return paraSnakeCase(`${nomeTabela}_${nomeColuna ?? nomePropriedade}`);
  }

  override indexName(tabelaOuNome: Table | string, colunas: string[]): string {
    return `idx_${nomeDaTabela(tabelaOuNome)}_${colunas.join('_')}`;
  }

  override primaryKeyName(tabelaOuNome: Table | string): string {
    // Sem este override o TypeORM gera `PK_<hash>`, ilegivel no psql e nos
    // erros do Postgres. Uma tabela so tem uma PK, entao o nome da tabela basta.
    return `pk_${nomeDaTabela(tabelaOuNome)}`;
  }

  override foreignKeyName(tabelaOuNome: Table | string, nomesColunas: string[]): string {
    return `fk_${nomeDaTabela(tabelaOuNome)}_${nomesColunas.join('_')}`;
  }
}
