import type { Metadata } from "next";
import Link from "next/link";
import { Upload, Copy, Search, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Help",
  description:
    "Learn how to use GearForge to browse, upload, and share WoW housing designs. Step-by-step guide for World of Warcraft player housing.",
};

export default function HelpPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How to Use GearForge",
            description: "Learn how to browse, upload, and share WoW housing designs",
            step: [
              {
                "@type": "HowToStep",
                name: "Browse Designs",
                text: "Use the Browse page to discover community housing designs. Filter by category or search for specific styles.",
              },
              {
                "@type": "HowToStep",
                name: "Copy Import String",
                text: "Click 'Copy Import String' on any design to copy it to your clipboard.",
              },
              {
                "@type": "HowToStep",
                name: "Import in WoW",
                text: "Open WoW's housing interface and paste the import string to recreate the design.",
              },
              {
                "@type": "HowToStep",
                name: "Upload Your Own",
                text: "Log in with Battle.net, click Upload, and share your housing creations with the community.",
              },
            ],
          }),
        }}
      />
      <div className="container page-section">
        <div className="content-page">
          <h1 className="font-display" style={{ fontSize: "2rem", marginBottom: "var(--space-lg)" }}>
            How to Use GearForge
          </h1>

          <div className="help-steps">
            <div className="help-step">
              <div className="help-step-number">1</div>
              <div className="help-step-icon">
                <Search size={24} />
              </div>
              <h3>Browse Designs</h3>
              <p>
                Visit the <Link href="/browse" className="text-accent">Browse</Link> page to discover
                housing designs. Use filters to find specific categories like bedrooms, taverns,
                or gardens. Search for specific styles or themes.
              </p>
            </div>

            <div className="help-step">
              <div className="help-step-number">2</div>
              <div className="help-step-icon">
                <Copy size={24} />
              </div>
              <h3>Copy Import String</h3>
              <p>
                When you find a design you like, click the &ldquo;Copy Import String&rdquo; button.
                This copies the housing layout code to your clipboard.
              </p>
            </div>

            <div className="help-step">
              <div className="help-step-number">3</div>
              <div className="help-step-icon">
                <Heart size={24} />
              </div>
              <h3>Import in WoW</h3>
              <p>
                Open World of Warcraft and go to your housing interface. Look for the import
                option and paste the string. The design will be loaded into your home.
              </p>
              <p className="text-muted" style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
                Note: You need to own the decor items used in the design.
              </p>
            </div>

            <div className="help-step">
              <div className="help-step-number">4</div>
              <div className="help-step-icon">
                <Upload size={24} />
              </div>
              <h3>Upload Your Own</h3>
              <p>
                Want to share your creations? Log in with your Battle.net account, then click
                <Link href="/upload" className="text-accent"> Upload</Link>. Add screenshots,
                paste your import string, and choose a category.
              </p>
            </div>
          </div>

          <div className="help-more">
            <h2>Need More Help?</h2>
            <p>
              Check out our <Link href="/faq" className="text-accent">FAQ</Link> for answers
              to common questions.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
