import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import {
  AtualizarPatologiaDto,
  CriarPatologiaDto,
  ListarPatologiasDto,
} from './dto/patologia.dto';
import { CriarSinalDto } from './dto/sinal.dto';
import { AtualizarTratamentoDto, CriarTratamentoDto } from './dto/tratamento.dto';
import { PatologiasService } from './patologias.service';
import { SinaisService } from './sinais.service';
import { TratamentosService } from './tratamentos.service';

/** ParseUUIDPipe evita que um id invalido vire erro de cast do Postgres (500). */
const PipeUuid = new ParseUUIDPipe({ version: '4' });

@Controller('patologias')
export class PatologiasController {
  constructor(
    private readonly patologias: PatologiasService,
    private readonly sinais: SinaisService,
    private readonly tratamentos: TratamentosService,
  ) {}

  @Get()
  listar(@Query() filtros: ListarPatologiasDto, @UsuarioAtual('id') usuarioId: string) {
    return this.patologias.listar(filtros, usuarioId);
  }

  @Get(':id')
  buscar(@Param('id', PipeUuid) id: string, @UsuarioAtual('id') usuarioId: string) {
    return this.patologias.buscarPorId(id, usuarioId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  criar(@Body() dados: CriarPatologiaDto, @UsuarioAtual('id') usuarioId: string) {
    return this.patologias.criar(dados, usuarioId);
  }

  @Patch(':id')
  atualizar(
    @Param('id', PipeUuid) id: string,
    @Body() dados: AtualizarPatologiaDto,
    @UsuarioAtual('id') usuarioId: string,
  ) {
    return this.patologias.atualizar(id, dados, usuarioId);
  }

  @Delete(':id')
  remover(@Param('id', PipeUuid) id: string, @UsuarioAtual('id') usuarioId: string) {
    return this.patologias.remover(id, usuarioId);
  }

  // --- Sinais clinicos ---

  @Post(':id/sinais')
  @HttpCode(HttpStatus.CREATED)
  criarSinal(
    @Param('id', PipeUuid) patologiaId: string,
    @Body() dados: CriarSinalDto,
    @UsuarioAtual('id') usuarioId: string,
  ) {
    return this.sinais.criar(patologiaId, dados, usuarioId);
  }

  @Delete(':id/sinais/:sinalId')
  removerSinal(
    @Param('id', PipeUuid) patologiaId: string,
    @Param('sinalId', PipeUuid) sinalId: string,
    @UsuarioAtual('id') usuarioId: string,
  ) {
    return this.sinais.remover(patologiaId, sinalId, usuarioId);
  }

  // --- Tratamentos ---

  @Post(':id/tratamentos')
  @HttpCode(HttpStatus.CREATED)
  criarTratamento(
    @Param('id', PipeUuid) patologiaId: string,
    @Body() dados: CriarTratamentoDto,
    @UsuarioAtual('id') usuarioId: string,
  ) {
    return this.tratamentos.criar(patologiaId, dados, usuarioId);
  }

  @Patch(':id/tratamentos/:tratamentoId')
  atualizarTratamento(
    @Param('id', PipeUuid) patologiaId: string,
    @Param('tratamentoId', PipeUuid) tratamentoId: string,
    @Body() dados: AtualizarTratamentoDto,
    @UsuarioAtual('id') usuarioId: string,
  ) {
    return this.tratamentos.atualizar(patologiaId, tratamentoId, dados, usuarioId);
  }

  @Delete(':id/tratamentos/:tratamentoId')
  removerTratamento(
    @Param('id', PipeUuid) patologiaId: string,
    @Param('tratamentoId', PipeUuid) tratamentoId: string,
    @UsuarioAtual('id') usuarioId: string,
  ) {
    return this.tratamentos.remover(patologiaId, tratamentoId, usuarioId);
  }
}
