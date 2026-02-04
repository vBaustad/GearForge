import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function PrivacyPage() {
  return (
    <div className="container page-section legal-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      <h1 className="font-display">Privacy Policy</h1>
      <p className="legal-updated">Last updated: February 2026</p>

      <section>
        <h2>Overview</h2>
        <p>
          GearForge ("we", "us", or "our") is a community platform for sharing World of Warcraft
          housing designs. This Privacy Policy explains how we collect, use, and protect your information.
        </p>
      </section>

      <section>
        <h2>Information We Collect</h2>

        <h3>Account Information</h3>
        <p>
          When you log in with Battle.net, we receive your BattleTag and account ID from Blizzard.
          We do not receive or store your Battle.net password.
        </p>

        <h3>Content You Create</h3>
        <p>
          When you upload designs, we store the images, import strings, titles, descriptions,
          and tags you provide. This content is publicly visible.
        </p>

        <h3>Profile Information</h3>
        <p>
          You may optionally add a bio and links to your Twitch or YouTube channels.
          This information is publicly visible on your profile.
        </p>

        <h3>Usage Data</h3>
        <p>
          We collect basic analytics including page views and design view counts to improve
          the platform. We do not use third-party tracking cookies.
        </p>
      </section>

      <section>
        <h2>How We Use Your Information</h2>
        <ul>
          <li>To provide and maintain the GearForge platform</li>
          <li>To display your designs and profile to other users</li>
          <li>To show engagement metrics (likes, views)</li>
          <li>To improve our services based on usage patterns</li>
          <li>To communicate important updates about the platform</li>
        </ul>
      </section>

      <section>
        <h2>Data Storage</h2>
        <p>
          Your data is stored securely using Convex, a cloud database service.
          Images are stored in Convex file storage. All data is encrypted in transit.
        </p>
      </section>

      <section>
        <h2>Third-Party Services</h2>
        <p>We use the following third-party services:</p>
        <ul>
          <li><strong>Blizzard Battle.net</strong> - For authentication</li>
          <li><strong>Convex</strong> - For data storage</li>
          <li><strong>Vercel</strong> - For hosting</li>
        </ul>
      </section>

      <section>
        <h2>Your Rights</h2>
        <p>You can:</p>
        <ul>
          <li>View and edit your profile information at any time</li>
          <li>Delete your designs at any time</li>
          <li>Request deletion of your account by contacting us</li>
        </ul>
      </section>

      <section>
        <h2>Data Retention</h2>
        <p>
          We retain your data for as long as your account is active. If you delete your account,
          we will delete your personal information within 30 days, though some anonymized data
          may be retained for analytics purposes.
        </p>
      </section>

      <section>
        <h2>Children's Privacy</h2>
        <p>
          GearForge is not intended for children under 13. We do not knowingly collect
          information from children under 13.
        </p>
      </section>

      <section>
        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify users of
          significant changes by posting a notice on the platform.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          If you have questions about this Privacy Policy, please visit our{" "}
          <Link to="/about">About page</Link> for contact information.
        </p>
      </section>
    </div>
  );
}
