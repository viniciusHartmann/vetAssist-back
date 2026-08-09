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
import {
  AtualizarSinalDto,
  CriarSinalDto,
  ListarSinaisDto,
  RemoverDoCatalogoDto,
} from './dto/sinal.dto';
import { SinaisService } from './sinais.service';

const PipeUuid = new ParseUUIDPipe({ version: '4' });

/** Catalogo global de sinais clinicos, independente de patologia. */
@Controller('sinais')
export class SinaisController {
  constructor(private readonly sinais: SinaisService) {}

  /** Atende o autocomplete do formulario e a listagem do catalogo. */
  @Get()
  listar(@Query() filtros: ListarSinaisDto) {
    return this.sinais.listar(filtros);
  }

  @Get(':id')
  buscar(@Param('id', PipeUuid) id: string) {
    return this.sinais.buscarPorId(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  criar(@Body() dados: CriarSinalDto) {
    return this.sinais.criar(dados);
  }

  @Patch(':id')
  atualizar(@Param('id', PipeUuid) id: string, @Body() dados: AtualizarSinalDto) {
    return this.sinais.atualizar(id, dados);
  }

  @Delete(':id')
  remover(@Param('id', PipeUuid) id: string, @Query() query: RemoverDoCatalogoDto) {
    return this.sinais.remover(id, query.forcar ?? false);
  }
}
