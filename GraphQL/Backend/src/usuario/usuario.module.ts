import { Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { UsuarioResolver } from './usuario.resolver';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [UsuarioResolver, UsuarioService, PrismaService],
  exports: [UsuarioService],
})
export class UsuarioModule {}
