import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function TermsPage() {
  return (
    <div className="container page-section legal-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      <h1 className="font-display">Terms of Service</h1>
      <p className="legal-updated">Last updated: February 2026</p>

      <section>
        <h2>Agreement to Terms</h2>
        <p>
          By accessing or using GearForge, you agree to be bound by these Terms of Service.
          If you disagree with any part of these terms, you may not use our service.
        </p>
      </section>

      <section>
        <h2>Description of Service</h2>
        <p>
          GearForge is a community platform for sharing World of Warcraft housing designs.
          Users can upload, browse, like, and save housing designs created by the community.
        </p>
      </section>

      <section>
        <h2>User Accounts</h2>
        <p>
          To upload designs, you must authenticate with a valid Battle.net account.
          You are responsible for maintaining the security of your account and for all
          activities that occur under your account.
        </p>
      </section>

      <section>
        <h2>User Content</h2>

        <h3>Ownership</h3>
        <p>
          You retain ownership of the content you upload. By uploading content to GearForge,
          you grant us a non-exclusive, worldwide license to display, distribute, and promote
          your content on the platform.
        </p>

        <h3>Content Guidelines</h3>
        <p>You agree not to upload content that:</p>
        <ul>
          <li>Infringes on others' intellectual property rights</li>
          <li>Contains offensive, hateful, or inappropriate material</li>
          <li>Is spam or misleading</li>
          <li>Violates any applicable laws</li>
          <li>Contains malicious code or exploits</li>
        </ul>

        <h3>Content Removal</h3>
        <p>
          We reserve the right to remove any content that violates these terms or that we
          deem inappropriate, without prior notice.
        </p>
      </section>

      <section>
        <h2>Intellectual Property</h2>
        <p>
          World of Warcraft and related assets are trademarks of Blizzard Entertainment.
          GearForge is a fan-made community tool and is not affiliated with or endorsed by Blizzard.
        </p>
        <p>
          The GearForge platform, logo, and original content are our intellectual property.
        </p>
      </section>

      <section>
        <h2>Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the service for any illegal purpose</li>
          <li>Attempt to gain unauthorized access to any part of the service</li>
          <li>Interfere with or disrupt the service</li>
          <li>Scrape or collect user data without permission</li>
          <li>Impersonate other users or entities</li>
          <li>Upload false or misleading content</li>
        </ul>
      </section>

      <section>
        <h2>Disclaimer of Warranties</h2>
        <p>
          GearForge is provided "as is" without warranties of any kind. We do not guarantee
          that the service will be uninterrupted, secure, or error-free.
        </p>
      </section>

      <section>
        <h2>Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, GearForge and its operators shall not be
          liable for any indirect, incidental, special, or consequential damages arising
          from your use of the service.
        </p>
      </section>

      <section>
        <h2>Account Termination</h2>
        <p>
          We may terminate or suspend your account at any time for violations of these terms.
          You may also request deletion of your account at any time.
        </p>
      </section>

      <section>
        <h2>Changes to Terms</h2>
        <p>
          We may modify these terms at any time. Continued use of the service after changes
          constitutes acceptance of the new terms.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For questions about these Terms, please visit our{" "}
          <Link to="/about">About page</Link>.
        </p>
      </section>
    </div>
  );
}
