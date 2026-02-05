import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "GearForge privacy policy - how we collect, use, and protect your data.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="container page-section">
      <div className="content-page legal-page">
        <h1 className="font-display" style={{ fontSize: "2rem", marginBottom: "var(--space-lg)" }}>
          Privacy Policy
        </h1>

        <p className="text-muted" style={{ marginBottom: "var(--space-xl)" }}>
          Last updated: February 2026
        </p>

        <section>
          <h2>Information We Collect</h2>
          <p>
            When you use GearForge, we collect information you provide directly:
          </p>
          <ul>
            <li>Battle.net account information (Battle Tag, account ID) when you log in</li>
            <li>Housing designs, screenshots, and import strings you upload</li>
            <li>Your likes, saves, and other interactions with content</li>
          </ul>
          <p>
            We also automatically collect:
          </p>
          <ul>
            <li>Usage data (pages visited, features used)</li>
            <li>Device information (browser type, operating system)</li>
            <li>IP address for security and fraud prevention</li>
          </ul>
        </section>

        <section>
          <h2>How We Use Your Information</h2>
          <ul>
            <li>To provide and improve our services</li>
            <li>To display your creations to other users</li>
            <li>To personalize your experience</li>
            <li>To communicate with you about your account</li>
            <li>To ensure security and prevent abuse</li>
          </ul>
        </section>

        <section>
          <h2>Information Sharing</h2>
          <p>
            We do not sell your personal information. We may share information:
          </p>
          <ul>
            <li>With your consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and prevent fraud</li>
            <li>With service providers who help operate our platform</li>
          </ul>
        </section>

        <section>
          <h2>Data Security</h2>
          <p>
            We implement appropriate security measures to protect your information.
            However, no internet transmission is completely secure.
          </p>
        </section>

        <section>
          <h2>Your Rights</h2>
          <p>
            You can access, update, or delete your account information at any time
            through your profile settings. To request data deletion, contact us.
          </p>
        </section>

        <section>
          <h2>Third-Party Services</h2>
          <p>
            We use Blizzard&apos;s OAuth for authentication. Their privacy policy applies
            to information collected during login.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            For privacy questions, contact us through GitHub or the support link
            in the footer.
          </p>
        </section>
      </div>
    </div>
  );
}
