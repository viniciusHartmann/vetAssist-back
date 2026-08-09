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
import { RemoverDoCatalogoDto } from './dto/sinal.dto';
import {
  AtualizarTratamentoDto,
  CriarTratamentoDto,
  ListarTratamentosDto,
} from './dto/tratamento.dto';
import { TratamentosService } from './tratamentos.service';

const PipeUuid = new ParseUUIDPipe({ version: '4' });

/** Catalogo global de tratamentos, independente de patologia. */
@Controller('tratamentos')
export class TratamentosController {
  constructor(private readonly tratamentos: TratamentosService) {}

  @Get()
  listar(@Query() filtros: ListarTratamentosDto) {
    return this.tratamentos.listar(filtros);
  }

  @Get(':id')
  buscar(@Param('id', PipeUuid) id: string) {
    return this.tratamentos.buscarPorId(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  criar(@Body() dados: CriarTratamentoDto) {
    return this.tratamentos.criar(dados);
  }

  @Patch(':id')
  atualizar(@Param('id', PipeUuid) id: string, @Body() dados: AtualizarTratamentoDto) {
    return this.tratamentos.atualizar(id, dados);
  }

  @Delete(':id')
  remover(@Param('id', PipeUuid) id: string, @Query() query: RemoverDoCatalogoDto) {
    return this.tratamentos.remover(id, query.forcar ?? false);
  }
}
