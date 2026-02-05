import { Link } from "react-router-dom";
import { Download, Upload, Copy, Search, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { SEO } from "@/components/SEO";

export function HelpPage() {
  return (
    <>
      <SEO
        title="Help & Guides - GearForge"
        description="Learn how to export WoW housing designs, upload to GearForge, and import other players' creations. Step-by-step guide for World of Warcraft player housing."
        url="/help"
        keywords="WoW housing guide, how to export WoW housing, how to import WoW housing design, WoW housing import string tutorial, World of Warcraft housing help, WoW home design guide, TWW housing tutorial, share WoW housing, copy WoW housing code, WoW housing export guide"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to Share WoW Housing Designs",
          description: "Step-by-step guide to exporting, uploading, and importing World of Warcraft housing designs.",
          step: [
            {
              "@type": "HowToStep",
              name: "Export your design",
              text: "Open your housing in edit mode, find the Export option in the housing UI, and copy the export string.",
            },
            {
              "@type": "HowToStep",
              name: "Upload to GearForge",
              text: "Log in with Battle.net, click Upload, add screenshots and paste your import string.",
            },
            {
              "@type": "HowToStep",
              name: "Share with the community",
              text: "Your design is now visible to all WoW housing enthusiasts!",
            },
          ],
        }}
      />
      <div className="container page-section">
      {/* Hero */}
      <div style={{ maxWidth: '720px', marginBottom: 'var(--space-3xl)' }}>
        <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', marginBottom: 'var(--space-md)' }}>
          Help & Guides
        </h1>
        <p className="text-secondary" style={{ fontSize: '1.125rem', lineHeight: 1.7 }}>
          Learn how to export your housing designs from World of Warcraft and share them with the community.
        </p>
      </div>

      {/* Quick Links */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-3xl)'
      }}>
        <a href="#exporting" className="btn btn-secondary">
          <Download size={16} />
          Exporting Designs
        </a>
        <a href="#uploading" className="btn btn-secondary">
          <Upload size={16} />
          Uploading to GearForge
        </a>
        <a href="#importing" className="btn btn-secondary">
          <Copy size={16} />
          Importing Designs
        </a>
        <a href="#browsing" className="btn btn-secondary">
          <Search size={16} />
          Finding Designs
        </a>
      </div>

      {/* Exporting Section */}
      <section id="exporting" style={{ marginBottom: 'var(--space-3xl)', scrollMarginTop: '100px' }}>
        <h2 className="font-display" style={{ fontSize: '1.5rem', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={24} className="text-accent" />
          Exporting Your Design from WoW
        </h2>

        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <div className="help-steps">
            <div className="help-step">
              <div className="help-step-number">1</div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Open Housing Mode</h4>
                <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                  Enter your player housing and activate edit mode. You can do this by clicking the
                  housing icon in your UI or using the <code>/housing</code> command.
                </p>
              </div>
            </div>

            <div className="help-step">
              <div className="help-step-number">2</div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Open the Export Menu</h4>
                <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                  In the housing UI, look for the <strong>Export</strong> button or option. This is
                  usually found in the settings or management panel of the housing interface.
                </p>
              </div>
            </div>

            <div className="help-step">
              <div className="help-step-number">3</div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Copy the Export String</h4>
                <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                  Click "Copy to Clipboard" or select all the text in the export dialog. This string
                  contains all the information about your design - furniture placement, rotations, and items.
                </p>
              </div>
            </div>

            <div className="help-step">
              <div className="help-step-number">4</div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Take Screenshots</h4>
                <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                  Capture 1-5 screenshots of your design from different angles. Good screenshots help
                  others appreciate your work before importing it.
                </p>
              </div>
            </div>
          </div>

          <div className="help-tip" style={{ marginTop: 'var(--space-xl)' }}>
            <CheckCircle size={18} className="text-accent" />
            <span><strong>Tip:</strong> Take screenshots with good lighting and from multiple angles to showcase your design's best features.</span>
          </div>
        </div>
      </section>

      {/* Uploading Section */}
      <section id="uploading" style={{ marginBottom: 'var(--space-3xl)', scrollMarginTop: '100px' }}>
        <h2 className="font-display" style={{ fontSize: '1.5rem', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Upload size={24} className="text-accent" />
          Uploading to GearForge
        </h2>

        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <div className="help-steps">
            <div className="help-step">
              <div className="help-step-number">1</div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Login with Battle.net</h4>
                <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                  Click the "Login with Battle.net" button in the header. This verifies you're a real
                  WoW player and links your designs to your account.
                </p>
              </div>
            </div>

            <div className="help-step">
              <div className="help-step-number">2</div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Go to Upload</h4>
                <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                  Click "Upload" in the navigation bar to open the upload form.
                </p>
              </div>
            </div>

            <div className="help-step">
              <div className="help-step-number">3</div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Fill in the Details</h4>
                <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                  Add a title, select a category (Bedroom, Tavern, Garden, etc.), write an optional
                  description, and paste your export string.
                </p>
              </div>
            </div>

            <div className="help-step">
              <div className="help-step-number">4</div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Add Screenshots</h4>
                <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                  Upload 1-5 screenshots. The first image will be your thumbnail - make it count!
                </p>
              </div>
            </div>

            <div className="help-step">
              <div className="help-step-number">5</div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Submit</h4>
                <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                  Click "Upload Design" and you're done! Your design will be live immediately.
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-xl)' }}>
            <Link to="/upload" className="btn btn-primary">
              <Upload size={16} />
              Upload Your Design
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Importing Section */}
      <section id="importing" style={{ marginBottom: 'var(--space-3xl)', scrollMarginTop: '100px' }}>
        <h2 className="font-display" style={{ fontSize: '1.5rem', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Copy size={24} className="text-accent" />
          Importing a Design In-Game
        </h2>

        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <div className="help-steps">
            <div className="help-step">
              <div className="help-step-number">1</div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Find a Design You Like</h4>
                <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                  Browse the gallery and click on a design to view its details.
                </p>
              </div>
            </div>

            <div className="help-step">
              <div className="help-step-number">2</div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Copy the Import String</h4>
                <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                  On the design page, click the "Copy" button next to the import string. This copies
                  it to your clipboard.
                </p>
              </div>
            </div>

            <div className="help-step">
              <div className="help-step-number">3</div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Open Housing Import</h4>
                <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                  In WoW, open your housing in edit mode and find the <strong>Import</strong> option
                  in the housing UI.
                </p>
              </div>
            </div>

            <div className="help-step">
              <div className="help-step-number">4</div>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Paste and Confirm</h4>
                <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                  Paste the import string (Ctrl+V or Cmd+V) and confirm the import. Your housing will
                  be updated with the new design!
                </p>
              </div>
            </div>
          </div>

          <div className="help-warning" style={{ marginTop: 'var(--space-xl)' }}>
            <AlertCircle size={18} />
            <span><strong>Note:</strong> Importing a design may overwrite your current housing layout. Consider exporting your current design first as a backup.</span>
          </div>
        </div>
      </section>

      {/* Browsing Section */}
      <section id="browsing" style={{ marginBottom: 'var(--space-3xl)', scrollMarginTop: '100px' }}>
        <h2 className="font-display" style={{ fontSize: '1.5rem', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={24} className="text-accent" />
          Finding the Perfect Design
        </h2>

        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <div style={{ display: 'grid', gap: 'var(--space-xl)' }}>
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Browse by Category</h4>
              <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                Use the category dropdown to filter designs by room type: Bedroom, Tavern, Garden,
                Library, Kitchen, Great Hall, and more.
              </p>
            </div>

            <div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Sort Options</h4>
              <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                Sort by "Newest" to see the latest uploads, or "Popular" to find highly-liked designs.
              </p>
            </div>

            <div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Search</h4>
              <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                Use the search bar to find designs by title or tags. Try searching for themes like
                "cozy", "medieval", or "night elf".
              </p>
            </div>

            <div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Like & Save</h4>
              <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                Like designs you enjoy - they'll appear in your profile's "Liked" tab so you can
                find them later.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-xl)' }}>
            <Link to="/browse" className="btn btn-primary">
              <Search size={16} />
              Browse Designs
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Still Need Help? */}
      <section>
        <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Still Need Help?</h3>
          <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
            Check out our FAQ or reach out on social media.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', justifyContent: 'center' }}>
            <Link to="/faq" className="btn btn-secondary">
              View FAQ
            </Link>
            <Link to="/about" className="btn btn-secondary">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
