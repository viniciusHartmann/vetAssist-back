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
import { PatologiasService } from './patologias.service';

/** ParseUUIDPipe evita que um id invalido vire erro de cast do Postgres (500). */
const PipeUuid = new ParseUUIDPipe({ version: '4' });

@Controller('patologias')
export class PatologiasController {
  constructor(private readonly patologias: PatologiasService) {}

  @Get()
  listar(@Query() filtros: ListarPatologiasDto, @UsuarioAtual('id') usuarioId: string) {
    return this.patologias.listar(filtros, usuarioId);
  }

  @Get(':id')
  buscar(@Param('id', PipeUuid) id: string, @UsuarioAtual('id') usuarioId: string) {
    return this.patologias.buscarPorId(id, usuarioId);
  }

  /** Aceita sinais/tratamentos existentes e novos no mesmo payload. */
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

  // --- Vinculos ---
  //
  // Rotas de conveniencia para mexer em um vinculo isolado (o "x" no chip) sem
  // reenviar o formulario inteiro via PATCH. Nunca criam nem apagam itens do
  // catalogo: so a linha da tabela de juncao. O cadastro de sinais e
  // tratamentos em si vive em /sinais e /tratamentos.

  @Post(':id/sinais/:sinalId')
  vincularSinal(
    @Param('id', PipeUuid) patologiaId: string,
    @Param('sinalId', PipeUuid) sinalId: string,
    @UsuarioAtual('id') usuarioId: string,
  ) {
    return this.patologias.vincularSinal(patologiaId, sinalId, usuarioId);
  }

  @Delete(':id/sinais/:sinalId')
  desvincularSinal(
    @Param('id', PipeUuid) patologiaId: string,
    @Param('sinalId', PipeUuid) sinalId: string,
    @UsuarioAtual('id') usuarioId: string,
  ) {
    return this.patologias.desvincularSinal(patologiaId, sinalId, usuarioId);
  }

  @Post(':id/tratamentos/:tratamentoId')
  vincularTratamento(
    @Param('id', PipeUuid) patologiaId: string,
    @Param('tratamentoId', PipeUuid) tratamentoId: string,
    @UsuarioAtual('id') usuarioId: string,
  ) {
    return this.patologias.vincularTratamento(patologiaId, tratamentoId, usuarioId);
  }

  @Delete(':id/tratamentos/:tratamentoId')
  desvincularTratamento(
    @Param('id', PipeUuid) patologiaId: string,
    @Param('tratamentoId', PipeUuid) tratamentoId: string,
    @UsuarioAtual('id') usuarioId: string,
  ) {
    return this.patologias.desvincularTratamento(patologiaId, tratamentoId, usuarioId);
  }
}
