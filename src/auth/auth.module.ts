import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Usuario } from './entities/usuario.entity';
import { AuthGuard } from './guards/auth.guard';
import { SessaoService } from './sessao.service';
import { SupabaseClientProvider } from './supabase.client';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  controllers: [AuthController],
  providers: [AuthService, SessaoService, SupabaseClientProvider, AuthGuard],
  exports: [AuthService, SessaoService, AuthGuard],
})
export class AuthModule {}
