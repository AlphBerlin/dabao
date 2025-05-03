import { Context } from 'telegraf';
import { PrismaClient } from '@prisma/client';

// Extended context type with our custom fields
export interface TelegrafContext extends Context {
  prisma: PrismaClient;
  projectId?: string;
}
