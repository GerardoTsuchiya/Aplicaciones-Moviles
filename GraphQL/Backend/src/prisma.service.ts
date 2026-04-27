
import 'dotenv/config';
import { Injectable } from '@nestjs/common';
import { PrismaClient } from './generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const databaseUrl = (process.env.DATABASE_URL || '').replace(/^mysql:\/\//, 'mariadb://');
    const adapter = new PrismaMariaDb(databaseUrl);
    super({ adapter });
  }
}
