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
    <>
    {/* your layout */}
      <p>test</p>
    </>
      
    
  )
}