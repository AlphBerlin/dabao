// prisma/seeds/BaseSeedTask.ts
import { PrismaClient, Prisma } from '@prisma/client'

export abstract class BaseSeedTask {
  /** Semantic version of this seed, e.g. "1.0", "1.1" */
  static version: string
  protected prisma!: PrismaClient | Prisma.TransactionClient

  constructor(protected globalPrisma: PrismaClient) {}

  /** Template method that wraps everything in a DB transaction */
  public async execute(): Promise<void> {
    await this.globalPrisma.$transaction(async (tx) => {
      this.prisma = tx // use the transactional client
      try {
        await this.preRun()
        await this.run()
        await this.postRun()
      } catch (err) {
        await this.handleRevert(err)
        throw err
      }
    })
  }

  /**–––  Hooks for your seed logic  –––*/
  protected async preRun(): Promise<void> {} // e.g. validate preconditions
  protected abstract run(): Promise<void> // your upserts/inserts
  protected async postRun(): Promise<void> {} // e.g. log success

  /**–––  Hooks for rollback beyond DB  –––*/
  protected async preRevert(): Promise<void> {}
  protected async revert(): Promise<void> {}
  protected async postRevert(): Promise<void> {}

  /** Called if `run()` throws, *inside* the same transaction */
  private async handleRevert(originalError: unknown) {
    try {
      await this.preRevert()
      await this.revert()
      await this.postRevert()
    } catch (revertError) {
      console.error(
        'Seed rollback error',
        revertError,
        'Original:',
        originalError,
      )
    }
  }
}
