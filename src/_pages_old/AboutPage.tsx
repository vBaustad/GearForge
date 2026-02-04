import { Heart, Users, Sparkles, Github, Twitter } from "lucide-react";
import { SEO } from "@/components/SEO";

export function AboutPage() {
  return (
    <>
      <SEO
        title="About GearForge"
        description="GearForge is a free community platform for sharing World of Warcraft housing designs. Upload, browse, and discover WoW home creations."
        url="/about"
        keywords="GearForge about, WoW housing community, World of Warcraft housing platform, free WoW design sharing, WoW housing website, TWW housing tool, WoW home designs community, Warcraft housing gallery"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About GearForge",
          description: "GearForge is a community-driven platform for sharing World of Warcraft housing designs.",
          mainEntity: {
            "@type": "Organization",
            name: "GearForge",
            description: "A free platform for sharing WoW housing designs",
            url: "https://gearforge.io",
          },
        }}
      />
      <div className="container page-section">
      {/* Hero */}
      <div style={{ maxWidth: '720px', marginBottom: 'var(--space-3xl)' }}>
        <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', marginBottom: 'var(--space-md)' }}>
          About GearForge
        </h1>
        <p className="text-secondary" style={{ fontSize: '1.125rem', lineHeight: 1.7 }}>
          GearForge is a community-driven platform for sharing World of Warcraft housing designs.
          We believe every player deserves a beautiful home in Azeroth.
        </p>
      </div>

      {/* Mission Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-lg)',
        marginBottom: 'var(--space-3xl)'
      }}>
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--accent-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-md)'
          }}>
            <Sparkles size={24} className="text-accent" />
          </div>
          <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Share Your Creations</h3>
          <p className="text-secondary" style={{ lineHeight: 1.6 }}>
            Upload your housing designs with screenshots and import strings.
            Help others recreate your vision.
          </p>
        </div>

        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--accent-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-md)'
          }}>
            <Users size={24} className="text-accent" />
          </div>
          <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Community First</h3>
          <p className="text-secondary" style={{ lineHeight: 1.6 }}>
            Built by players, for players. Browse, save, and get inspired by
            designs from creators around the world.
          </p>
        </div>

        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--accent-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-md)'
          }}>
            <Heart size={24} className="text-accent" />
          </div>
          <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Free Forever</h3>
          <p className="text-secondary" style={{ lineHeight: 1.6 }}>
            No paywalls, no premium tiers. GearForge is completely free
            and always will be.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div style={{ marginBottom: 'var(--space-3xl)' }}>
        <h2 className="font-display" style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xl)' }}>
          How It Works
        </h2>
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ display: 'flex', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
              <span className="text-accent" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, lineHeight: 1 }}>1</span>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Create in-game</h4>
                <p className="text-secondary">Design your dream home using WoW's housing system.</p>
              </div>
            </li>
            <li style={{ display: 'flex', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
              <span className="text-accent" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, lineHeight: 1 }}>2</span>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Export your design</h4>
                <p className="text-secondary">Use the export feature to get your design's import string.</p>
              </div>
            </li>
            <li style={{ display: 'flex', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
              <span className="text-accent" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, lineHeight: 1 }}>3</span>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Share on GearForge</h4>
                <p className="text-secondary">Upload screenshots and your import string for others to discover.</p>
              </div>
            </li>
            <li style={{ display: 'flex', gap: 'var(--space-lg)' }}>
              <span className="text-accent" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, lineHeight: 1 }}>4</span>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Browse & import</h4>
                <p className="text-secondary">Find designs you love, copy the import string, and use it in-game.</p>
              </div>
            </li>
          </ol>
        </div>
      </div>

      {/* Contact / Links */}
      <div>
        <h2 className="font-display" style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xl)' }}>
          Get In Touch
        </h2>
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)', lineHeight: 1.6 }}>
            Have feedback, found a bug, or want to contribute? We'd love to hear from you.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
            <a
              href="https://github.com/vBaustad/GearForge"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <Github size={18} />
              GitHub
            </a>
            <a
              href="https://twitter.com/GearForgeWoW"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <Twitter size={18} />
              Twitter
            </a>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
