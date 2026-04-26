"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { CreateItemDialog } from "@/components/items/create-item-dialog";
import { Button } from "@/components/ui/button";
import type { CollectionOption } from "@/components/items/collection-multi-select";
import type { DashboardItemTypeKey } from "@/lib/mock-data";

interface TypePageCreateButtonProps {
  collectionOptions: CollectionOption[];
  typeKey: DashboardItemTypeKey;
  typeName: string;
}

export function TypePageCreateButton({
  collectionOptions,
  typeKey,
  typeName,
}: TypePageCreateButtonProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        className="h-11 rounded-xl bg-zinc-50 px-4 text-zinc-950 hover:bg-white"
        onClick={() => setIsCreateDialogOpen(true)}
      >
        <Plus className="size-4" />
        New {typeName}
      </Button>

      {isCreateDialogOpen ? (
        <CreateItemDialog
          key={typeKey}
          collectionOptions={collectionOptions}
          initialType={typeKey}
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      ) : null}
    </>
  );
}
