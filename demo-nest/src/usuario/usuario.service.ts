import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioInput } from './dto/create-usuario-input';
import { UpdateUsuarioInput } from './dto/update-usuario-input';

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  create(createUsuarioInput: CreateUsuarioInput) {
    return this.prisma.usuario.create({ data: createUsuarioInput });
  }

  findAll() {
    return this.prisma.usuario.findMany();
  }

  findOne(id: number) {
    return this.prisma.usuario.findUnique({ where: { id } });
  }

  update(id: number, updateUsuarioInput: UpdateUsuarioInput) {
    return this.prisma.usuario.update({
      where: { id },
      data: updateUsuarioInput,
    });
  }

  remove(id: number) {
    return this.prisma.usuario.delete({ where: { id } });
  }
}
