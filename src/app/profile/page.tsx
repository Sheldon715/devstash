import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProfilePageContent } from "@/components/profile/profile-page-content";
import { getDashboardSidebarCollections } from "@/lib/db/collections";
import { getDashboardSidebarItemTypes } from "@/lib/db/items";
import { getProfilePageData } from "@/lib/db/profile";

function formatProfileDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [profile, sidebarCollections, sidebarItemTypes] = await Promise.all([
    getProfilePageData(session.user.id),
    getDashboardSidebarCollections(),
    getDashboardSidebarItemTypes(),
  ]);

  if (!profile) {
    redirect("/sign-in");
  }

  return (
    <DashboardShell
      currentUser={{
        email: session.user.email ?? profile.email,
        image: session.user.image,
        name: session.user.name,
      }}
      favoriteCollections={sidebarCollections.favoriteCollections}
      recentCollections={sidebarCollections.recentCollections}
      sidebarItemTypes={sidebarItemTypes}
    >
      <ProfilePageContent
        profile={profile}
        memberSinceLabel={formatProfileDate(profile.createdAt)}
      />
    </DashboardShell>
  );
}
