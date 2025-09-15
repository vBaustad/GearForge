import { SimpleDocPage } from "./SimpleDocPage";

export default function PrivacyPage() {
  return (
    <SimpleDocPage
      title="Privacy Policy"
      description="How GearForge handles data."
      canonical="/privacy"
      noindex
    >
      <p><em>Last updated: {new Date().toISOString().slice(0,10)}</em></p>
      <p>We process your SimC text locally in your browser. We do not store your character data.</p>
      <p>We may collect anonymous analytics (page views, perf metrics) to improve the site.</p>
      <p>Questions? Email: hello@your-domain</p>
    </SimpleDocPage>
  );
}
