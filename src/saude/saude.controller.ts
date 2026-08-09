import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Publico } from '../auth/decorators/publico.decorator';

interface RespostaSaude {
  status: 'ok' | 'degradado';
  banco: 'ok' | 'indisponivel';
}

@Controller('saude')
export class SaudeController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Verifica TCP + SSL + credenciais do Postgres com um SELECT trivial.
   * E o teste mais rapido para separar "app nao subiu" de "banco inacessivel".
   */
  @Publico()
  @Get()
  async verificar(): Promise<RespostaSaude> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', banco: 'ok' };
    } catch {
      return { status: 'degradado', banco: 'indisponivel' };
    }
  }
}
