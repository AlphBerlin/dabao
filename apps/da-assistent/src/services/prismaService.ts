import { PrismaClient } from '@prisma/client';

/**
 * Service to handle database operations using Prisma ORM
 */
export class PrismaService {
  private static instance: PrismaService;
  public prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get a singleton instance of PrismaService
   */
  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  /**
   * Connect to the database
   */
  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log('Connected to database');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the database
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    console.log('Disconnected from database');
  }
}