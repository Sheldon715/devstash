export interface HomepageAction {
  href: string;
  label: string;
}

export interface HomepageFeature {
  accent: HomepageAccent;
  description: string;
  icon: HomepageIcon;
  title: string;
}

export interface HomepagePreviewCard {
  accent: HomepageAccent;
  label: string;
  title: string;
}

export interface HomepagePricingPlan {
  ctaLabel: string;
  description: string;
  features: HomepagePricingFeature[];
  href: string;
  isPopular?: boolean;
  monthlyPrice: string;
  name: string;
  yearlyPrice?: string;
}

export interface HomepagePricingFeature {
  included: boolean;
  label: string;
}

export interface HomepageFooterGroup {
  links: HomepageAction[];
  title: string;
}

export type HomepageAccent =
  | "snippet"
  | "prompt"
  | "command"
  | "note"
  | "file"
  | "image"
  | "url";

export type HomepageIcon =
  | "code"
  | "sparkles"
  | "search"
  | "terminal"
  | "file"
  | "folder";

export const navLinks: HomepageAction[] = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
];

export const itemAccentClasses: Record<HomepageAccent, string> = {
  command: "border-cyan-300/35 text-cyan-200",
  file: "border-slate-300/35 text-slate-200",
  image: "border-pink-300/35 text-pink-200",
  note: "border-emerald-300/35 text-emerald-200",
  prompt: "border-amber-300/35 text-amber-200",
  snippet: "border-blue-300/35 text-blue-200",
  url: "border-indigo-300/35 text-indigo-200",
};

export const itemAccentBackgrounds: Record<HomepageAccent, string> = {
  command: "from-cyan-300/10 to-cyan-300/0",
  file: "from-slate-300/10 to-slate-300/0",
  image: "from-pink-300/10 to-pink-300/0",
  note: "from-emerald-300/10 to-emerald-300/0",
  prompt: "from-amber-300/10 to-amber-300/0",
  snippet: "from-blue-300/10 to-blue-300/0",
  url: "from-indigo-300/10 to-indigo-300/0",
};

export const previewCards: HomepagePreviewCard[] = [
  { accent: "snippet", label: "snippet", title: "React hook" },
  { accent: "prompt", label: "prompt", title: "Review prompt" },
  { accent: "command", label: "command", title: "Deploy script" },
  { accent: "note", label: "note", title: "Auth notes" },
  { accent: "image", label: "image", title: "Wireframe" },
  { accent: "url", label: "url", title: "API docs" },
];

export const featureCards: HomepageFeature[] = [
  {
    accent: "snippet",
    description: "Save working patterns, helpers, and examples with language-aware metadata.",
    icon: "code",
    title: "Code Snippets",
  },
  {
    accent: "prompt",
    description: "Keep reusable prompts, context packs, and workflows ready for the next task.",
    icon: "sparkles",
    title: "AI Prompts",
  },
  {
    accent: "url",
    description: "Search across titles, descriptions, tags, collections, and mixed item types.",
    icon: "search",
    title: "Instant Search",
  },
  {
    accent: "command",
    description: "Store terminal recipes, deploy commands, and setup steps you trust.",
    icon: "terminal",
    title: "Commands",
  },
  {
    accent: "file",
    description: "Attach reference files, implementation notes, screenshots, and specs.",
    icon: "file",
    title: "Files & Docs",
  },
  {
    accent: "note",
    description: "Group related items for projects, learning paths, playbooks, and clients.",
    icon: "folder",
    title: "Collections",
  },
];

export const aiHighlights = [
  "Suggest tags from saved content",
  "Summarize long notes and docs",
  "Explain snippets before reuse",
  "Rewrite prompts into stronger variants",
];

export const pricingPlans: HomepagePricingPlan[] = [
  {
    ctaLabel: "Start Free",
    description: "For getting your everyday snippets, prompts, notes, and commands into one place.",
    features: [
      { included: true, label: "50 saved items" },
      { included: true, label: "3 collections" },
      { included: true, label: "Core search and tagging" },
      { included: true, label: "Built-in item types" },
      { included: false, label: "File and image uploads" },
      { included: false, label: "Unlimited items" },
      { included: false, label: "AI summaries and generated tags" },
      { included: false, label: "Custom item types" },
    ],
    href: "/register",
    monthlyPrice: "$0",
    name: "Free",
  },
  {
    ctaLabel: "Go Pro",
    description: "For builders who want more space, more structure, and AI cleanup tools.",
    features: [
      { included: true, label: "Unlimited saved items" },
      { included: true, label: "Unlimited collections" },
      { included: true, label: "AI summaries and generated tags" },
      { included: true, label: "Custom item types" },
      { included: true, label: "Larger file and image uploads" },
      { included: true, label: "Prompt rewrite helpers" },
      { included: true, label: "Snippet explainers" },
      { included: true, label: "Priority workspace features" },
    ],
    href: "/settings?billing=pro",
    isPopular: true,
    monthlyPrice: "$8",
    name: "Pro",
    yearlyPrice: "$72",
  },
];

export const footerGroups: HomepageFooterGroup[] = [
  {
    links: [
      { href: "#features", label: "Features" },
      { href: "#pricing", label: "Pricing" },
    ],
    title: "Product",
  },
  {
    links: [
      { href: "/register", label: "Start Free" },
      { href: "/sign-in", label: "Sign In" },
    ],
    title: "Account",
  },
  {
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/", label: "Home" },
    ],
    title: "Workspace",
  },
];
