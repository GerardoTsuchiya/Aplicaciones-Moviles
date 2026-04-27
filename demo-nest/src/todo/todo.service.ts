import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoInput } from './dto/create-todo-input';
import { UpdateTodoInput } from './dto/update-todo-input';

@Injectable()
export class TodoService {
  constructor(private prisma: PrismaService) {}

  create(createTodoInput: CreateTodoInput) {
    return this.prisma.todo.create({ data: createTodoInput });
  }

  findAll() {
    return this.prisma.todo.findMany();
  }

  findOne(id: number) {
    return this.prisma.todo.findUnique({ where: { id } });
  }

  update(id: number, updateTodoInput: UpdateTodoInput) {
    return this.prisma.todo.update({
      where: { id },
      data: updateTodoInput,
    });
  }

  remove(id: number) {
    return this.prisma.todo.delete({ where: { id } });
  }
}
