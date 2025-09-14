import { SimpleDocPage } from "./SimpleDocPage";

export default function TermsPage() {
  return (
    <SimpleDocPage
      title="Terms of Service"
      description="Terms of Service for GearForge."
      canonical="/terms"
      noindex
    >
      <p><em>Last updated: {new Date().toISOString().slice(0,10)}</em></p>
      <h2>1. Acceptance</h2><p>By using GearForge, you agree to these terms.</p>
      <h2>2. Use</h2><p>Personal, non-commercial use. Don’t abuse the service.</p>
      <h2>3. Data</h2><p>SimC input is processed client-side; we don’t store your character data.</p>
      <h2>4. Warranty &amp; Liability</h2><p>Provided “as is”.</p>
      <h2>5. Changes</h2><p>We may update these terms.</p>
      <h2>6. Contact</h2><p>Email: hello@your-domain</p>
    </SimpleDocPage>
  );
}
