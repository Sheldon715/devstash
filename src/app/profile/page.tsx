import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProfilePageContent } from "@/components/profile/profile-page-content";
import { getAllDashboardCollections } from "@/lib/db/collections";
import { getUserEditorPreferences } from "@/lib/db/editor-preferences";
import { getDashboardSidebarItemTypes } from "@/lib/db/items";
import { getProfilePageData } from "@/lib/db/profile";
import {
  getDashboardSearchItems,
  mapCollectionsToDashboardSearchRecords,
} from "@/lib/db/search";

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

  const [profile, collections, sidebarItemTypes, searchItems, editorPreferences] = await Promise.all([
    getProfilePageData(session.user.id),
    getAllDashboardCollections(session.user.id),
    getDashboardSidebarItemTypes(session.user.id),
    getDashboardSearchItems(session.user.id),
    getUserEditorPreferences(session.user.id),
  ]);

  if (!profile) {
    redirect("/sign-in");
  }

  const favoriteCollections = collections.filter((collection) => collection.isFavorite).slice(0, 4);
  const recentCollections = collections.slice(0, 4);
  const collectionOptions = collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
  }));
  const searchData = {
    items: searchItems,
    collections: mapCollectionsToDashboardSearchRecords(collections),
  };

  return (
    <DashboardShell
      collectionOptions={collectionOptions}
      currentUser={{
        email: session.user.email ?? profile.email,
        image: session.user.image,
        name: session.user.name,
      }}
      editorPreferences={editorPreferences}
      favoriteCollections={favoriteCollections}
      recentCollections={recentCollections}
      searchData={searchData}
      sidebarItemTypes={sidebarItemTypes}
    >
      <ProfilePageContent
        profile={profile}
        memberSinceLabel={formatProfileDate(profile.createdAt)}
      />
    </DashboardShell>
  );
}
