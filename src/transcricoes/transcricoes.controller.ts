import { Controller, Delete, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import { ListarTranscricoesDto } from './dto/listar-transcricoes.dto';
import { TranscricoesService } from './transcricoes.service';

const PipeUuid = new ParseUUIDPipe({ version: '4' });

@Controller('transcricoes')
export class TranscricoesController {
  constructor(private readonly transcricoes: TranscricoesService) {}

  @Get()
  listar(@Query() filtros: ListarTranscricoesDto, @UsuarioAtual('id') usuarioId: string) {
    return this.transcricoes.listar(filtros, usuarioId);
  }

  @Get(':id')
  buscar(@Param('id', PipeUuid) id: string, @UsuarioAtual('id') usuarioId: string) {
    return this.transcricoes.buscarPorId(id, usuarioId);
  }

  @Delete(':id')
  remover(@Param('id', PipeUuid) id: string, @UsuarioAtual('id') usuarioId: string) {
    return this.transcricoes.remover(id, usuarioId);
  }
}
