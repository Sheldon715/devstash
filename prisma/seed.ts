import "dotenv/config";

import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";
import { ItemContentMode, Plan } from "../generated/prisma/enums";

type SeedItemDefinition = {
  title: string;
  description: string;
  typeKey: string;
  content?: string;
  url?: string;
  language?: string;
  isFavorite?: boolean;
  isPinned?: boolean;
};

type SeedCollectionDefinition = {
  name: string;
  description: string;
  isFavorite?: boolean;
  items: SeedItemDefinition[];
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the seed script.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
  }),
});

const demoUser = {
  email: "demo@devstash.io",
  name: "Demo User",
  password: "12345678",
};

const systemItemTypes = [
  {
    key: "snippet",
    name: "snippet",
    icon: "Code",
    color: "#3b82f6",
    contentMode: ItemContentMode.TEXT,
  },
  {
    key: "prompt",
    name: "prompt",
    icon: "Sparkles",
    color: "#8b5cf6",
    contentMode: ItemContentMode.TEXT,
  },
  {
    key: "command",
    name: "command",
    icon: "Terminal",
    color: "#f97316",
    contentMode: ItemContentMode.TEXT,
  },
  {
    key: "note",
    name: "note",
    icon: "StickyNote",
    color: "#fde047",
    contentMode: ItemContentMode.TEXT,
  },
  {
    key: "file",
    name: "file",
    icon: "File",
    color: "#6b7280",
    contentMode: ItemContentMode.FILE,
  },
  {
    key: "image",
    name: "image",
    icon: "Image",
    color: "#ec4899",
    contentMode: ItemContentMode.FILE,
  },
  {
    key: "link",
    name: "link",
    icon: "Link",
    color: "#10b981",
    contentMode: ItemContentMode.URL,
  },
] as const;

const collections: SeedCollectionDefinition[] = [
  {
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
    isFavorite: true,
    items: [
      {
        title: "Custom hooks starter pack",
        description: "Examples for reusable hooks like debounce and local storage state.",
        typeKey: "snippet",
        language: "typescript",
        isFavorite: true,
        content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : initialValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(storedValue));
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}`,
      },
      {
        title: "Compound components with context",
        description: "Pattern for keeping related components flexible and composable.",
        typeKey: "snippet",
        language: "typescript",
        isPinned: true,
        content: `import { createContext, useContext, useState, type ReactNode } from "react";

type TabsContextValue = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({
  defaultTab,
  children,
}: {
  defaultTab: string;
  children: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="space-y-4">{children}</div>
    </TabsContext.Provider>
  );
}

export function useTabs() {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error("useTabs must be used within Tabs.");
  }

  return context;
}`,
      },
      {
        title: "Typed utility helpers",
        description: "Small utilities for class names, grouping, and safe object access.",
        typeKey: "snippet",
        language: "typescript",
        content: `export function groupBy<TItem, TKey extends string | number>(
  items: TItem[],
  getKey: (item: TItem) => TKey,
) {
  return items.reduce<Record<TKey, TItem[]>>((groups, item) => {
    const key = getKey(item);
    const existing = groups[key] ?? [];

    return {
      ...groups,
      [key]: [...existing, item],
    };
  }, {} as Record<TKey, TItem[]>);
}

export function pick<TObject extends object, TKey extends keyof TObject>(
  value: TObject,
  keys: TKey[],
) {
  return keys.reduce<Pick<TObject, TKey>>((result, key) => {
    result[key] = value[key];
    return result;
  }, {} as Pick<TObject, TKey>);
}`,
      },
    ],
  },
  {
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
    isFavorite: true,
    items: [
      {
        title: "Code review prompt",
        description: "A reusable prompt for focused bug-risk and regression reviews.",
        typeKey: "prompt",
        isFavorite: true,
        content: `Review this change like a senior engineer. Focus on correctness, regressions, security, and missing tests. Ignore style unless it affects maintainability. Return findings ordered by severity with file references and a short explanation for each.`,
      },
      {
        title: "Documentation generation prompt",
        description: "Generate concise docs from code, decisions, and tradeoffs.",
        typeKey: "prompt",
        content: `Create developer-facing documentation for this feature. Include what it does, how it works, the important inputs and outputs, and any operational caveats. Keep the tone practical and skip marketing language.`,
      },
      {
        title: "Refactoring assistant prompt",
        description: "Ask for safe, incremental refactors instead of broad rewrites.",
        typeKey: "prompt",
        isPinned: true,
        content: `Refactor this implementation in small safe steps. Preserve behavior, call out risks before changing public contracts, and explain how each step improves readability, testability, or maintainability.`,
      },
    ],
  },
  {
    name: "DevOps",
    description: "Infrastructure and deployment resources",
    items: [
      {
        title: "Docker and CI starter config",
        description: "A starting point for containerized app builds and CI pipelines.",
        typeKey: "snippet",
        language: "yaml",
        content: `services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production

name: ci
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build`,
      },
      {
        title: "Deployment helper commands",
        description: "Common commands for production builds, migrations, and rollout checks.",
        typeKey: "command",
        content: `npm ci
npm run build
npx prisma migrate deploy
npm run start`,
      },
      {
        title: "Docker documentation",
        description: "Official docs for building, shipping, and running containers.",
        typeKey: "link",
        url: "https://docs.docker.com/",
      },
      {
        title: "GitHub Actions documentation",
        description: "Official docs for workflows, runners, and deployment automation.",
        typeKey: "link",
        url: "https://docs.github.com/actions",
      },
    ],
  },
];

async function upsertSystemItemTypes() {
  const entries = await Promise.all(
    systemItemTypes.map((itemType) =>
      prisma.itemType.upsert({
        where: {
          key: itemType.key,
        },
        update: {
          name: itemType.name,
          icon: itemType.icon,
          color: itemType.color,
          contentMode: itemType.contentMode,
          isSystem: true,
          userId: null,
        },
        create: {
          key: itemType.key,
          name: itemType.name,
          icon: itemType.icon,
          color: itemType.color,
          contentMode: itemType.contentMode,
          isSystem: true,
        },
      }),
    ),
  );

  return new Map(entries.map((itemType) => [itemType.key, itemType.id]));
}

async function seed() {
  const passwordHash = await hash(demoUser.password, 12);
  const now = new Date();

  const user = await prisma.user.upsert({
    where: {
      email: demoUser.email,
    },
    update: {
      name: demoUser.name,
      passwordHash,
      emailVerified: now,
      plan: Plan.FREE,
    },
    create: {
      email: demoUser.email,
      name: demoUser.name,
      passwordHash,
      emailVerified: now,
      plan: Plan.FREE,
    },
  });

  const itemTypeIds = await upsertSystemItemTypes();

  await prisma.tag.deleteMany({
    where: {
      userId: user.id,
    },
  });

  await prisma.item.deleteMany({
    where: {
      userId: user.id,
    },
  });

  await prisma.collection.deleteMany({
    where: {
      userId: user.id,
    },
  });

  for (const collectionDefinition of collections) {
    const collection = await prisma.collection.create({
      data: {
        userId: user.id,
        name: collectionDefinition.name,
        description: collectionDefinition.description,
        isFavorite: collectionDefinition.isFavorite ?? false,
      },
    });

    for (const [index, itemDefinition] of collectionDefinition.items.entries()) {
      const typeId = itemTypeIds.get(itemDefinition.typeKey);

      if (!typeId) {
        throw new Error(`Missing item type for key: ${itemDefinition.typeKey}`);
      }

      await prisma.item.create({
        data: {
          userId: user.id,
          typeId,
          title: itemDefinition.title,
          description: itemDefinition.description,
          contentMode: itemDefinition.url ? ItemContentMode.URL : ItemContentMode.TEXT,
          content: itemDefinition.content,
          url: itemDefinition.url,
          language: itemDefinition.language,
          isFavorite: itemDefinition.isFavorite ?? false,
          isPinned: itemDefinition.isPinned ?? false,
          lastAccessedAt: now,
          collections: {
            create: {
              collectionId: collection.id,
              sortOrder: index,
            },
          },
        },
      });
    }
  }

  console.log(
    `Seeded demo user ${demoUser.email} with ${systemItemTypes.length} system item types and ${collections.length} collections.`,
  );
}

seed()
  .catch((error) => {
    console.error("Seeding failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
