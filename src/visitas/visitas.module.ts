// TODO(escopo-futuro): modulo nao implementado nesta entrega.
import { Module } from '@nestjs/common';
import { VisitasGateway } from './visitas.gateway';

@Module({
  providers: [VisitasGateway],
})
export class VisitasModule {}
