import type { Metadata } from "next";
import { UploadPageClient } from "./UploadPageClient";

export const metadata: Metadata = {
  title: "Upload Housing Design",
  description: "Share your World of Warcraft housing creation with the community. Upload screenshots and import strings.",
  robots: { index: false, follow: false }, // Don't index upload page
};

export default function UploadPage() {
  return <UploadPageClient />;
}
