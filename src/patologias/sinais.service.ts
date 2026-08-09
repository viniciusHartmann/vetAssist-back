import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NaoEncontradoException } from '../common/errors/excecoes';
import { CriarSinalDto } from './dto/sinal.dto';
import { SinalClinico } from './entities/sinal-clinico.entity';
import { PatologiasService } from './patologias.service';

@Injectable()
export class SinaisService {
  constructor(
    @InjectRepository(SinalClinico)
    private readonly sinais: Repository<SinalClinico>,
    private readonly patologias: PatologiasService,
  ) {}

  async criar(
    patologiaId: string,
    dados: CriarSinalDto,
    usuarioId: string,
  ): Promise<SinalClinico> {
    await this.patologias.garantirExistencia(patologiaId, usuarioId);

    const sinal = this.sinais.create({ patologiaId, descricao: dados.descricao });

    return this.sinais.save(sinal);
  }

  async remover(
    patologiaId: string,
    sinalId: string,
    usuarioId: string,
  ): Promise<{ sucesso: true }> {
    await this.patologias.garantirExistencia(patologiaId, usuarioId);

    // Conferir que o sinal pertence a esta patologia. Sem isso seria possivel
    // apagar o sinal de outra patologia so adivinhando o id (IDOR).
    const sinal = await this.sinais.findOne({ where: { id: sinalId, patologiaId } });

    if (!sinal) {
      throw new NaoEncontradoException('Sinal clinico nao encontrado nesta patologia.');
    }

    await this.sinais.delete({ id: sinalId });

    return { sucesso: true };
  }
}
