import { usePageMeta } from "../../seo/usePageMeta"; // adjust path if different

export default function GuidesPage() {
  usePageMeta({
    title: "Guides",
    description: "Class & gearing guides (coming soon).",
    canonical: "/guides",
    noindex: true,
  });

  return (
    <main style={{ padding: 24 }}>
      <h1>Guides</h1>
      <p>We’re working on class- and gearing-focused guides. Check back soon.</p>
    </main>
  );
}
