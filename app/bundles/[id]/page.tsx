import type { Metadata } from "next";
import { BundleDetailClient } from "./BundleDetailClient";

export const metadata: Metadata = {
  title: "Room Bundle - GearForge",
  description: "View a complete room design bundle with multiple coordinated pieces.",
};

export default async function BundleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BundleDetailClient bundleId={id} />;
}
