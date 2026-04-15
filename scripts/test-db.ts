import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to test the database connection.");
  }

  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const databaseVersionResult = await prisma.$queryRaw<
      Array<{ current_database: string; version: string }>
    >`SELECT current_database(), version()`;

    const usersCount = await prisma.user.count();

    const databaseInfo = databaseVersionResult[0];

    console.log("Database connection successful.");
    console.log(`Database: ${databaseInfo?.current_database ?? "unknown"}`);
    console.log(`Users table rows: ${usersCount}`);
    console.log(
      `PostgreSQL version: ${databaseInfo?.version ?? "unknown version"}`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Database connection test failed.");
  console.error(error);
  process.exit(1);
});
