import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "GearForge terms of service - rules and guidelines for using our platform.",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <div className="container page-section">
      <div className="content-page legal-page">
        <h1 className="font-display" style={{ fontSize: "2rem", marginBottom: "var(--space-lg)" }}>
          Terms of Service
        </h1>

        <p className="text-muted" style={{ marginBottom: "var(--space-xl)" }}>
          Last updated: February 2026
        </p>

        <section>
          <h2>Acceptance of Terms</h2>
          <p>
            By using GearForge, you agree to these terms. If you disagree,
            please do not use our service.
          </p>
        </section>

        <section>
          <h2>Use of Service</h2>
          <p>
            GearForge is a platform for sharing World of Warcraft housing designs.
            You may use our service to:
          </p>
          <ul>
            <li>Browse and search housing designs</li>
            <li>Upload your own housing creations</li>
            <li>Save and like designs</li>
            <li>Copy import strings for personal use in WoW</li>
          </ul>
        </section>

        <section>
          <h2>User Content</h2>
          <p>
            When you upload content to GearForge:
          </p>
          <ul>
            <li>You retain ownership of your creations</li>
            <li>You grant us license to display and share your content on our platform</li>
            <li>You confirm the content is your own or you have rights to share it</li>
            <li>You agree not to upload inappropriate, harmful, or illegal content</li>
          </ul>
        </section>

        <section>
          <h2>Account Responsibilities</h2>
          <p>
            You are responsible for:
          </p>
          <ul>
            <li>Maintaining the security of your Battle.net account</li>
            <li>All activity that occurs under your account</li>
            <li>Complying with Blizzard&apos;s terms of service</li>
          </ul>
        </section>

        <section>
          <h2>Prohibited Activities</h2>
          <p>
            You may not:
          </p>
          <ul>
            <li>Upload malicious content or spam</li>
            <li>Harass or abuse other users</li>
            <li>Attempt to exploit or hack our systems</li>
            <li>Use automated tools to scrape content</li>
            <li>Impersonate others</li>
          </ul>
        </section>

        <section>
          <h2>Intellectual Property</h2>
          <p>
            World of Warcraft and related content are property of Blizzard Entertainment.
            GearForge is not affiliated with or endorsed by Blizzard.
          </p>
        </section>

        <section>
          <h2>Disclaimers</h2>
          <p>
            GearForge is provided &ldquo;as is&rdquo; without warranties. We are not responsible
            for user-generated content or how import strings function in WoW.
          </p>
        </section>

        <section>
          <h2>Changes to Terms</h2>
          <p>
            We may update these terms. Continued use after changes constitutes
            acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            For questions about these terms, contact us through GitHub or
            the support link in the footer.
          </p>
        </section>
      </div>
    </div>
  );
}
