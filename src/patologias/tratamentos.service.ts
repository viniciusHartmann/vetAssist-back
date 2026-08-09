import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NaoEncontradoException, ValidacaoException } from '../common/errors/excecoes';
import { AtualizarTratamentoDto, CriarTratamentoDto } from './dto/tratamento.dto';
import { Tratamento } from './entities/tratamento.entity';
import { PatologiasService } from './patologias.service';

@Injectable()
export class TratamentosService {
  constructor(
    @InjectRepository(Tratamento)
    private readonly tratamentos: Repository<Tratamento>,
    private readonly patologias: PatologiasService,
  ) {}

  private async buscarNaPatologia(patologiaId: string, tratamentoId: string): Promise<Tratamento> {
    // Vinculo explicito com a patologia do path evita IDOR.
    const tratamento = await this.tratamentos.findOne({
      where: { id: tratamentoId, patologiaId },
    });

    if (!tratamento) {
      throw new NaoEncontradoException('Tratamento nao encontrado nesta patologia.');
    }

    return tratamento;
  }

  async criar(
    patologiaId: string,
    dados: CriarTratamentoDto,
    usuarioId: string,
  ): Promise<Tratamento> {
    await this.patologias.garantirExistencia(patologiaId, usuarioId);

    const tratamento = this.tratamentos.create({
      patologiaId,
      nome: dados.nome,
      descricao: dados.descricao ?? '',
    });

    return this.tratamentos.save(tratamento);
  }

  async atualizar(
    patologiaId: string,
    tratamentoId: string,
    dados: AtualizarTratamentoDto,
    usuarioId: string,
  ): Promise<Tratamento> {
    if (Object.keys(dados).length === 0) {
      throw new ValidacaoException('Informe ao menos um campo para atualizar.');
    }

    await this.patologias.garantirExistencia(patologiaId, usuarioId);
    const tratamento = await this.buscarNaPatologia(patologiaId, tratamentoId);

    if (dados.nome !== undefined) tratamento.nome = dados.nome;
    if (dados.descricao !== undefined) tratamento.descricao = dados.descricao;

    return this.tratamentos.save(tratamento);
  }

  async remover(
    patologiaId: string,
    tratamentoId: string,
    usuarioId: string,
  ): Promise<{ sucesso: true }> {
    await this.patologias.garantirExistencia(patologiaId, usuarioId);
    await this.buscarNaPatologia(patologiaId, tratamentoId);
    await this.tratamentos.delete({ id: tratamentoId });

    return { sucesso: true };
  }
}
