import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoService } from './catalogo.service';
import { Patologia } from './entities/patologia.entity';
import { SinalClinico } from './entities/sinal-clinico.entity';
import { Tratamento } from './entities/tratamento.entity';
import { PatologiasController } from './patologias.controller';
import { PatologiasService } from './patologias.service';
import { SinaisController } from './sinais.controller';
import { SinaisService } from './sinais.service';
import { TratamentosController } from './tratamentos.controller';
import { TratamentosService } from './tratamentos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Patologia, SinalClinico, Tratamento])],
  controllers: [PatologiasController, SinaisController, TratamentosController],
  providers: [PatologiasService, SinaisService, TratamentosService, CatalogoService],
  exports: [PatologiasService],
})
export class PatologiasModule {}
