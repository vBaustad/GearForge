import { usePageMeta } from "../../../app/seo/usePageMeta";

const faqs = [
  { q: "What is GearForge?", a: "A WoW gearing assistant for upgrades, crest/FS costs, and seasonal tracking." },
  { q: "Do I need to log in?", a: "No—paste your SimC export and analyze locally in your browser." },
];

export default function FaqPage() {
  usePageMeta({
    title: "FAQ",
    description: "Frequently asked questions about GearForge.",
    canonical: "/faq",
    noindex: true,
  });

  return (
    <main style={{ padding: 24 }}>
      <h1>FAQ</h1>
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {faqs.map((f, i) => (
          <details key={i}>
            <summary style={{ cursor: "pointer" }}>{f.q}</summary>
            <div style={{ marginTop: 8, color: "#9ca3af" }}>{f.a}</div>
          </details>
        ))}
      </div>
    </main>
  );
}
