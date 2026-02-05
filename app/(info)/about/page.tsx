import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Users, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about GearForge, the community platform for sharing World of Warcraft housing designs. Our mission is to help WoW players discover and share creative housing builds.",
};

export default function AboutPage() {
  return (
    <div className="container page-section">
      <div className="content-page">
        <h1 className="font-display" style={{ fontSize: "2rem", marginBottom: "var(--space-lg)" }}>
          About GearForge
        </h1>

        <div className="about-intro">
          <p>
            GearForge is a community platform dedicated to World of Warcraft player housing.
            We believe every adventurer deserves a beautiful home in Azeroth.
          </p>
        </div>

        <div className="about-values">
          <div className="about-value">
            <div className="about-value-icon">
              <Users size={28} />
            </div>
            <h3>Community First</h3>
            <p>
              Built by WoW players, for WoW players. Share your creations, get inspired
              by others, and be part of the housing community.
            </p>
          </div>

          <div className="about-value">
            <div className="about-value-icon">
              <Sparkles size={28} />
            </div>
            <h3>Easy Sharing</h3>
            <p>
              Upload your designs with screenshots and import strings. Others can copy
              and use your layouts with just one click.
            </p>
          </div>

          <div className="about-value">
            <div className="about-value-icon">
              <Heart size={28} />
            </div>
            <h3>Free Forever</h3>
            <p>
              GearForge is free to use. Browse designs, upload your own, and grow
              your housing portfolio without any cost.
            </p>
          </div>
        </div>

        <div className="about-cta">
          <p>Ready to share your housing creations?</p>
          <Link href="/upload" className="btn btn-primary">
            Upload Your First Design
          </Link>
        </div>

        <div className="about-footer">
          <p className="text-muted">
            GearForge is not affiliated with Blizzard Entertainment.
            World of Warcraft and related marks are trademarks of Blizzard Entertainment, Inc.
          </p>
        </div>
      </div>
    </div>
  );
}
