// prisma/seeds/index.ts
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const seedDir = path.resolve(__dirname)
const prisma = new PrismaClient()

async function main() {
  try {
    // 1. What has already been applied?
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "SeedVersion" (
        id SERIAL PRIMARY KEY,
        version TEXT UNIQUE,
        appliedAt TIMESTAMPTZ DEFAULT now()
      );`
    const applied = await prisma.seedVersion.findMany({
      select: { version: true },
    })
    const appliedSet = new Set(applied.map((r: any) => r.version))

    // 2. Discover + sort seed files
    const files = fs
      .readdirSync(seedDir)
      .filter((f) => /^\d+\.\d+.*\.ts$/.test(f))
      .sort()

    // 3. Run each new seed
    for (const file of files) {
      const modulePath = path.join(seedDir, file)
      const { default: SeedClass } = await import(modulePath)
      const version: string = SeedClass.version

      if (appliedSet.has(version)) continue

      console.log(`→ Applying seed ${version}`)
      const task = new SeedClass(prisma)
      await task.execute()

      // record it
      await prisma.seedVersion.create({ data: { version } })
      console.log(`✔ Seed ${version} done.`)
    }

    console.log('All seeds completed successfully')
  } catch (error) {
    console.error('Seed failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
