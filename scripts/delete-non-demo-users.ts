import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

const DEMO_EMAIL = "demo@devstash.io";
const RUN_FLAG = "--run";

type Summary = {
  accounts: number;
  collections: number;
  customItemTypes: number;
  items: number;
  sessions: number;
  tags: number;
  users: number;
  verificationTokens: number;
};

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run the cleanup script.");
  }

  return databaseUrl;
}

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: getDatabaseUrl(),
    }),
  });
}

async function buildSummary(prisma: PrismaClient): Promise<Summary> {
  const demoUser = await prisma.user.findUnique({
    where: {
      email: DEMO_EMAIL,
    },
    select: {
      id: true,
    },
  });

  if (!demoUser) {
    throw new Error(`Demo user ${DEMO_EMAIL} was not found. Aborting cleanup.`);
  }

  const [
    users,
    accounts,
    sessions,
    items,
    collections,
    tags,
    customItemTypes,
    verificationTokens,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        email: {
          not: DEMO_EMAIL,
        },
      },
    }),
    prisma.account.count({
      where: {
        user: {
          email: {
            not: DEMO_EMAIL,
          },
        },
      },
    }),
    prisma.session.count({
      where: {
        user: {
          email: {
            not: DEMO_EMAIL,
          },
        },
      },
    }),
    prisma.item.count({
      where: {
        user: {
          email: {
            not: DEMO_EMAIL,
          },
        },
      },
    }),
    prisma.collection.count({
      where: {
        user: {
          email: {
            not: DEMO_EMAIL,
          },
        },
      },
    }),
    prisma.tag.count({
      where: {
        user: {
          email: {
            not: DEMO_EMAIL,
          },
        },
      },
    }),
    prisma.itemType.count({
      where: {
        isSystem: false,
        user: {
          email: {
            not: DEMO_EMAIL,
          },
        },
      },
    }),
    prisma.verificationToken.count({
      where: {
        identifier: {
          not: DEMO_EMAIL,
        },
      },
    }),
  ]);

  return {
    accounts,
    collections,
    customItemTypes,
    items,
    sessions,
    tags,
    users,
    verificationTokens,
  };
}

function logSummary(summary: Summary) {
  console.table([
    {
      users: summary.users,
      accounts: summary.accounts,
      sessions: summary.sessions,
      items: summary.items,
      collections: summary.collections,
      tags: summary.tags,
      customItemTypes: summary.customItemTypes,
      verificationTokens: summary.verificationTokens,
    },
  ]);
}

async function deleteNonDemoUsers(prisma: PrismaClient) {
  const result = await prisma.$transaction(async (tx) => {
    const deletedVerificationTokens = await tx.verificationToken.deleteMany({
      where: {
        identifier: {
          not: DEMO_EMAIL,
        },
      },
    });

    const deletedUsers = await tx.user.deleteMany({
      where: {
        email: {
          not: DEMO_EMAIL,
        },
      },
    });

    return {
      deletedUsers: deletedUsers.count,
      deletedVerificationTokens: deletedVerificationTokens.count,
    };
  });

  return result;
}

async function main() {
  const prisma = createPrismaClient();
  const shouldRun = process.argv.includes(RUN_FLAG);

  try {
    const summary = await buildSummary(prisma);

    console.log(`Preserving demo account and content for ${DEMO_EMAIL}.`);
    console.log("Rows that match the cleanup criteria:");
    logSummary(summary);

    if (!shouldRun) {
      console.log("");
      console.log(
        `Dry run only. Re-run with "${RUN_FLAG}" to delete all non-demo users and their related data.`,
      );
      return;
    }

    const result = await deleteNonDemoUsers(prisma);

    console.log("");
    console.log("Cleanup complete.");
    console.table([
      {
        deletedUsers: result.deletedUsers,
        deletedVerificationTokens: result.deletedVerificationTokens,
      },
    ]);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Cleanup failed.");
  console.error(error);
  process.exit(1);
});
