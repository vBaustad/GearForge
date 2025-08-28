import { usePageMeta } from "../../app/seo/usePageMeta";

export function OptimizerPage() {
  usePageMeta({
    title: "GearForge — Optimize Your Gear",
    description: "Import, analyze, and optimize your gear with fast, clear recommendations.",
    ogTitle: "GearForge",
    ogDescription: "Forge the perfect setup.",
    ogImage: "/images/og/gearforge-wide-dark.png",
    canonical: typeof window !== "undefined" ? window.location.origin + "/" : undefined,
    robots: "index,follow",
  });

  return (
    <section className="min-h-[60vh] w-full grid place-items-center text-center rounded-lg border border-gray-800 bg-gray-900/50">
      <div>
        <h1 className="text-3xl font-bold text-white">Optimizer</h1>
        <p className="mt-2 text-gray-400">Coming soon — UI placeholder to keep layout stable.</p>
      </div>
    </section>
  );
}
