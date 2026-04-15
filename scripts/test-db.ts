import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";
import { ItemContentMode, Plan } from "../generated/prisma/enums";

const DEMO_EMAIL = "demo@devstash.io";

const EXPECTED_SYSTEM_TYPES = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
] as const;

const EXPECTED_COLLECTIONS = [
  { name: "React Patterns", itemCount: 3 },
  { name: "AI Workflows", itemCount: 3 },
  { name: "DevOps", itemCount: 4 },
  { name: "Terminal Commands", itemCount: 4 },
  { name: "Design Resources", itemCount: 4 },
] as const;

function assertCondition(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

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

    const [usersCount, systemItemTypesCount, demoUser, typeCounts] = await Promise.all([
      prisma.user.count(),
      prisma.itemType.count({
        where: {
          isSystem: true,
        },
      }),
      prisma.user.findUnique({
        where: {
          email: DEMO_EMAIL,
        },
        include: {
          collections: {
            include: {
              items: {
                include: {
                  item: {
                    include: {
                      type: true,
                    },
                  },
                },
                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
            orderBy: {
              name: "asc",
            },
          },
        },
      }),
      prisma.item.groupBy({
        by: ["contentMode"],
        where: {
          user: {
            email: DEMO_EMAIL,
          },
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const databaseInfo = databaseVersionResult[0];

    if (!demoUser) {
      throw new Error(`Demo user ${DEMO_EMAIL} was not found.`);
    }

    assertCondition(demoUser.plan === Plan.FREE, "Demo user plan should be FREE.");
    assertCondition(Boolean(demoUser.passwordHash), "Demo user is missing a password hash.");
    assertCondition(
      Boolean(demoUser.emailVerified),
      "Demo user should have a verified email timestamp.",
    );
    assertCondition(
      systemItemTypesCount === EXPECTED_SYSTEM_TYPES.length,
      `Expected ${EXPECTED_SYSTEM_TYPES.length} system item types but found ${systemItemTypesCount}.`,
    );

    const systemItemTypes = await prisma.itemType.findMany({
      where: {
        isSystem: true,
      },
      orderBy: {
        key: "asc",
      },
      select: {
        key: true,
        contentMode: true,
        icon: true,
        color: true,
      },
    });

    const systemItemTypeKeys = systemItemTypes.map((itemType) => itemType.key).sort();

    assertCondition(
      JSON.stringify(systemItemTypeKeys) === JSON.stringify([...EXPECTED_SYSTEM_TYPES].sort()),
      `System item types do not match the expected seed set: ${systemItemTypeKeys.join(", ")}.`,
    );

    assertCondition(
      demoUser.collections.length === EXPECTED_COLLECTIONS.length,
      `Expected ${EXPECTED_COLLECTIONS.length} collections but found ${demoUser.collections.length}.`,
    );

    const collectionRows = demoUser.collections.map((collection) => ({
      name: collection.name,
      description: collection.description ?? "",
      items: collection.items.length,
      itemTypes: [...new Set(collection.items.map((entry) => entry.item.type.key))].join(", "),
    }));

    for (const expectedCollection of EXPECTED_COLLECTIONS) {
      const collection = demoUser.collections.find(
        (entry) => entry.name === expectedCollection.name,
      );

      if (!collection) {
        throw new Error(`Expected collection "${expectedCollection.name}" was not found.`);
      }

      assertCondition(
        collection.items.length === expectedCollection.itemCount,
        `Collection "${expectedCollection.name}" should contain ${expectedCollection.itemCount} items but has ${collection.items.length}.`,
      );
    }

    const totalItems = demoUser.collections.reduce(
      (sum, collection) => sum + collection.items.length,
      0,
    );

    assertCondition(totalItems === 18, `Expected 18 seeded items but found ${totalItems}.`);

    const itemRows = demoUser.collections.flatMap((collection) =>
      collection.items.map((entry) => ({
        collection: collection.name,
        title: entry.item.title,
        type: entry.item.type.name,
        mode: entry.item.contentMode,
        language: entry.item.language ?? "-",
      })),
    );

    const contentModeCounts = {
      [ItemContentMode.TEXT]: 0,
      [ItemContentMode.FILE]: 0,
      [ItemContentMode.URL]: 0,
    };

    for (const row of typeCounts) {
      contentModeCounts[row.contentMode] = row._count._all;
    }

    console.log("Database connection successful.");
    console.log(`Database: ${databaseInfo?.current_database ?? "unknown"}`);
    console.log(`Users table rows: ${usersCount}`);
    console.log(`System item types: ${systemItemTypesCount}`);
    console.log(
      `PostgreSQL version: ${databaseInfo?.version ?? "unknown version"}`,
    );
    console.log("");
    console.log("Demo user:");
    console.table([
      {
        email: demoUser.email,
        name: demoUser.name ?? "",
        plan: demoUser.plan,
        emailVerified: demoUser.emailVerified?.toISOString() ?? "missing",
        collections: demoUser.collections.length,
        items: totalItems,
      },
    ]);

    console.log("System item types:");
    console.table(systemItemTypes);

    console.log("Seeded collections:");
    console.table(collectionRows);

    console.log("Content mode totals:");
    console.table([
      {
        textItems: contentModeCounts[ItemContentMode.TEXT],
        fileItems: contentModeCounts[ItemContentMode.FILE],
        urlItems: contentModeCounts[ItemContentMode.URL],
      },
    ]);

    console.log("Seeded items:");
    console.table(itemRows);

    console.log("Demo seed verification passed.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Database connection test failed.");
  console.error(error);
  process.exit(1);
});
