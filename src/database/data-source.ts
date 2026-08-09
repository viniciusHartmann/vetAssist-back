import 'reflect-metadata';
import { config as carregarEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { EstrategiaNomeSnakePt } from './naming.strategy';
import { OPCOES_POOL, limparParametrosSsl, montarOpcoesSsl } from './opcoes-conexao';

carregarEnv();

/**
 * DataSource usado APENAS pela CLI do TypeORM (migration:generate/run).
 * A aplicacao usa a configuracao de database.module.ts.
 *
 * O schema e criado por migrations (`npm run migration:run`), nao a mao.
 */
export default new DataSource({
  type: 'postgres',
  url: limparParametrosSsl(process.env.DATABASE_URL ?? ''),
  ssl: montarOpcoesSsl(process.env.DATABASE_SSL !== 'false'),
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  namingStrategy: new EstrategiaNomeSnakePt(),
  synchronize: false,
  extra: { ...OPCOES_POOL },
});
