import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patologia } from './entities/patologia.entity';
import { SinalClinico } from './entities/sinal-clinico.entity';
import { Tratamento } from './entities/tratamento.entity';
import { PatologiasController } from './patologias.controller';
import { PatologiasService } from './patologias.service';
import { SinaisService } from './sinais.service';
import { TratamentosService } from './tratamentos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Patologia, SinalClinico, Tratamento])],
  controllers: [PatologiasController],
  providers: [PatologiasService, SinaisService, TratamentosService],
  exports: [PatologiasService],
})
export class PatologiasModule {}
