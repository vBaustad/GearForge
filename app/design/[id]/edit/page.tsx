import type { Metadata } from "next";
import { EditDesignPageClient } from "./EditDesignPageClient";

export const metadata: Metadata = {
  title: "Edit Design",
  description: "Edit your housing design.",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDesignPage({ params }: PageProps) {
  const { id } = await params;
  return <EditDesignPageClient id={id} />;
}
