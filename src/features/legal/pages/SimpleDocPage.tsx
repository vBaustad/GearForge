// src/app/pages/legal/SimpleDocPage.tsx
import type { PropsWithChildren } from "react";
import { usePageMeta } from "../../../app/seo/usePageMeta";

type SimpleDocProps = PropsWithChildren<{
  title: string;
  description: string;
  canonical: string;
  noindex?: boolean;
}>;

export function SimpleDocPage({
  title,
  description,
  canonical,
  noindex = true,
  children,
}: SimpleDocProps) {
  usePageMeta({ title, description, canonical, noindex });

  return (
    <main style={{ padding: 24 }}>
      <h1>{title}</h1>
      <div style={{ marginTop: 12 }}>{children}</div>
    </main>
  );
}
