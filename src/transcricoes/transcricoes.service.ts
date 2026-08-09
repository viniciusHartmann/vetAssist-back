import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RespostaPaginada,
  montarRespostaPaginada,
} from '../common/dto/paginacao.dto';
import { NaoEncontradoException, ValidacaoException } from '../common/errors/excecoes';
import { fimDoIntervalo, inicioDoIntervalo } from './datas.util';
import { ListarTranscricoesDto } from './dto/listar-transcricoes.dto';
import { Transcricao } from './entities/transcricao.entity';

@Injectable()
export class TranscricoesService {
  constructor(
    @InjectRepository(Transcricao)
    private readonly transcricoes: Repository<Transcricao>,
  ) {}

  async listar(
    filtros: ListarTranscricoesDto,
    _usuarioId: string,
  ): Promise<RespostaPaginada<Transcricao>> {
    const query = this.transcricoes.createQueryBuilder('transcricao');

    if (filtros.nome) {
      query.andWhere('transcricao.nome ILIKE :nome', { nome: `%${filtros.nome}%` });
    }

    const dataDe = filtros.dataDe ? inicioDoIntervalo(filtros.dataDe) : undefined;
    const dataAte = filtros.dataAte ? fimDoIntervalo(filtros.dataAte) : undefined;

    if (dataDe && dataAte && dataDe > dataAte) {
      throw new ValidacaoException('Intervalo de datas invalido.', {
        dataDe: 'dataDe nao pode ser posterior a dataAte',
      });
    }

    if (dataDe) {
      query.andWhere('transcricao.gravadaEm >= :dataDe', { dataDe });
    }

    if (dataAte) {
      query.andWhere('transcricao.gravadaEm <= :dataAte', { dataAte });
    }

    const [itens, total] = await query
      .orderBy('transcricao.gravadaEm', 'DESC')
      .skip((filtros.page - 1) * filtros.limit)
      .take(filtros.limit)
      .getManyAndCount();

    return montarRespostaPaginada(itens, total, filtros.page, filtros.limit);
  }

  async buscarPorId(id: string, _usuarioId: string): Promise<Transcricao> {
    const transcricao = await this.transcricoes.findOne({ where: { id } });

    if (!transcricao) {
      throw new NaoEncontradoException('Transcricao nao encontrada.');
    }

    return transcricao;
  }

  async remover(id: string, usuarioId: string): Promise<{ sucesso: true }> {
    // 404 explicito em vez de sucesso silencioso: o front precisa distinguir
    // "apaguei" de "nao existia".
    await this.buscarPorId(id, usuarioId);
    await this.transcricoes.delete({ id });

    return { sucesso: true };
  }
}
