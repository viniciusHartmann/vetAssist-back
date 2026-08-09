import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transcricao } from './entities/transcricao.entity';
import { TranscricoesController } from './transcricoes.controller';
import { TranscricoesService } from './transcricoes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transcricao])],
  controllers: [TranscricoesController],
  providers: [TranscricoesService],
  exports: [TranscricoesService],
})
export class TranscricoesModule {}
