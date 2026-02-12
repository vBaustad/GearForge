import type { Metadata } from "next";
import { CollectionDetailClient } from "./CollectionDetailClient";

export const metadata: Metadata = {
  title: "Collection - GearForge",
  description: "View a curated collection of WoW housing designs.",
};

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CollectionDetailClient collectionId={id} />;
}
