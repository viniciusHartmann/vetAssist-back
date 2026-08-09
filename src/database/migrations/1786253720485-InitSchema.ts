import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1786253720485 implements MigrationInterface {
  name = 'InitSchema1786253720485';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- usuarios ---
    await queryRunner.query(
      `CREATE TABLE "usuarios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "supabase_id" text NOT NULL, "email" text NOT NULL, "nome" text, "url_avatar" text, "provedor" text NOT NULL DEFAULT 'google', "ultimo_login_em" TIMESTAMP WITH TIME ZONE, "ativo" boolean NOT NULL DEFAULT true, CONSTRAINT "pk_usuarios" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_usuarios_supabase_id" ON "usuarios" ("supabase_id") `,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_usuarios_email" ON "usuarios" ("email") `);

    // --- transcricoes ---
    await queryRunner.query(
      `CREATE TABLE "transcricoes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" text NOT NULL, "gravada_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "duracao_segundos" integer NOT NULL, "texto_completo" text NOT NULL, "analise" jsonb NOT NULL, "usuario_id" uuid, "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "pk_transcricoes" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_transcricoes_gravada_em" ON "transcricoes" ("gravada_em") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_transcricoes_usuario_id" ON "transcricoes" ("usuario_id") `,
    );

    // --- sinais_clinicos (catalogo global e compartilhado) ---
    //
    // Sem `usuario_id`: um sinal clinico e generico e nao tem dono. Qualquer
    // usuario busca e vincula qualquer sinal. Ja `patologias` e isolada por
    // usuario (ver ISOLAMENTO_ATIVO em patologias.service).
    await queryRunner.query(
      `CREATE TABLE "sinais_clinicos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "descricao" text NOT NULL, CONSTRAINT "pk_sinais_clinicos" PRIMARY KEY ("id"))`,
    );
    // Indice funcional: a coluna guarda a escrita original, mas duas linhas que
    // so diferem por maiuscula/minuscula sao o mesmo sinal. Sem `unaccent`
    // (nao e IMMUTABLE, logo nao pode entrar num indice).
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_sinais_clinicos_descricao" ON "sinais_clinicos" (lower("descricao"))`,
    );

    // --- patologias ---
    await queryRunner.query(
      `CREATE TABLE "patologias" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "nome" text NOT NULL, "especie" text NOT NULL, "descricao" text NOT NULL DEFAULT '', "usuario_id" uuid, CONSTRAINT "pk_patologias" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_patologias_nome" ON "patologias" ("nome") `);
    await queryRunner.query(`CREATE INDEX "idx_patologias_especie" ON "patologias" ("especie") `);
    await queryRunner.query(
      `CREATE INDEX "idx_patologias_usuario_id" ON "patologias" ("usuario_id") `,
    );

    // --- tratamentos (catalogo global e compartilhado, como os sinais) ---
    await queryRunner.query(
      `CREATE TABLE "tratamentos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "nome" text NOT NULL, "descricao" text NOT NULL DEFAULT '', CONSTRAINT "pk_tratamentos" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_tratamentos_nome" ON "tratamentos" (lower("nome"))`,
    );

    // --- juncoes N:N ---
    await queryRunner.query(
      `CREATE TABLE "patologias_sinais" ("patologia_id" uuid NOT NULL, "sinal_id" uuid NOT NULL, CONSTRAINT "pk_patologias_sinais" PRIMARY KEY ("patologia_id", "sinal_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_patologias_sinais_patologia_id" ON "patologias_sinais" ("patologia_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_patologias_sinais_sinal_id" ON "patologias_sinais" ("sinal_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "patologias_tratamentos" ("patologia_id" uuid NOT NULL, "tratamento_id" uuid NOT NULL, CONSTRAINT "pk_patologias_tratamentos" PRIMARY KEY ("patologia_id", "tratamento_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_patologias_tratamentos_patologia_id" ON "patologias_tratamentos" ("patologia_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_patologias_tratamentos_tratamento_id" ON "patologias_tratamentos" ("tratamento_id") `,
    );

    // --- chaves estrangeiras ---
    await queryRunner.query(
      `ALTER TABLE "transcricoes" ADD CONSTRAINT "fk_transcricoes_usuario_id" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "patologias" ADD CONSTRAINT "fk_patologias_usuario_id" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    // CASCADE nas juncoes: apagar uma patologia (ou um item de catalogo) leva
    // junto so as linhas de vinculo, nunca o registro do outro lado.
    await queryRunner.query(
      `ALTER TABLE "patologias_sinais" ADD CONSTRAINT "fk_patologias_sinais_patologia_id" FOREIGN KEY ("patologia_id") REFERENCES "patologias"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "patologias_sinais" ADD CONSTRAINT "fk_patologias_sinais_sinal_id" FOREIGN KEY ("sinal_id") REFERENCES "sinais_clinicos"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "patologias_tratamentos" ADD CONSTRAINT "fk_patologias_tratamentos_patologia_id" FOREIGN KEY ("patologia_id") REFERENCES "patologias"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "patologias_tratamentos" ADD CONSTRAINT "fk_patologias_tratamentos_tratamento_id" FOREIGN KEY ("tratamento_id") REFERENCES "tratamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "patologias_tratamentos" DROP CONSTRAINT "fk_patologias_tratamentos_tratamento_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patologias_tratamentos" DROP CONSTRAINT "fk_patologias_tratamentos_patologia_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patologias_sinais" DROP CONSTRAINT "fk_patologias_sinais_sinal_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patologias_sinais" DROP CONSTRAINT "fk_patologias_sinais_patologia_id"`,
    );
    await queryRunner.query(`ALTER TABLE "patologias" DROP CONSTRAINT "fk_patologias_usuario_id"`);
    await queryRunner.query(
      `ALTER TABLE "transcricoes" DROP CONSTRAINT "fk_transcricoes_usuario_id"`,
    );

    await queryRunner.query(`DROP INDEX "public"."idx_patologias_tratamentos_tratamento_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_patologias_tratamentos_patologia_id"`);
    await queryRunner.query(`DROP TABLE "patologias_tratamentos"`);
    await queryRunner.query(`DROP INDEX "public"."idx_patologias_sinais_sinal_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_patologias_sinais_patologia_id"`);
    await queryRunner.query(`DROP TABLE "patologias_sinais"`);
    await queryRunner.query(`DROP INDEX "public"."uq_tratamentos_nome"`);
    await queryRunner.query(`DROP TABLE "tratamentos"`);
    await queryRunner.query(`DROP INDEX "public"."idx_patologias_usuario_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_patologias_especie"`);
    await queryRunner.query(`DROP INDEX "public"."idx_patologias_nome"`);
    await queryRunner.query(`DROP TABLE "patologias"`);
    await queryRunner.query(`DROP INDEX "public"."uq_sinais_clinicos_descricao"`);
    await queryRunner.query(`DROP TABLE "sinais_clinicos"`);
    await queryRunner.query(`DROP INDEX "public"."idx_transcricoes_usuario_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_transcricoes_gravada_em"`);
    await queryRunner.query(`DROP TABLE "transcricoes"`);
    await queryRunner.query(`DROP INDEX "public"."idx_usuarios_email"`);
    await queryRunner.query(`DROP INDEX "public"."idx_usuarios_supabase_id"`);
    await queryRunner.query(`DROP TABLE "usuarios"`);
  }
}
