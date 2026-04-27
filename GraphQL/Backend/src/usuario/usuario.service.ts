import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUsuarioInput } from './dto/create-usuario.input';
import { UpdateUsuarioInput } from './dto/update-usuario.input';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsuarioService {

  constructor(private readonly prismaService: PrismaService) {}

  async create(createUsuarioInput: CreateUsuarioInput) {
    const hashed = await bcrypt.hash(createUsuarioInput.password, 10);
    return this.prismaService.user.create({
      data: { ...createUsuarioInput, password: hashed },
    });
  }

  findByEmail(email: string) {
    return this.prismaService.user.findUnique({ where: { email } });
  }

  findAll() {
    return this.prismaService.user.findMany();
  }

  findOne(id: number) {
    return this.prismaService.user.findUnique({
      where: { id },
    });
  }

  update(id: number, updateUsuarioInput: UpdateUsuarioInput) {
    const { id: _, ...data } = updateUsuarioInput;
    return this.prismaService.user.update({
      where: { id },
      data,
    });
  }

  remove(id: number) {
    return this.prismaService.user.delete({
      where: { id },
    });
  }
}
