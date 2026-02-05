import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { LandingPage } from "@/pages/LandingPage";
import { BrowsePage } from "@/pages/BrowsePage";
import { DesignPage } from "@/pages/DesignPage";
import { EditDesignPage } from "@/pages/EditDesignPage";
import { UploadPage } from "@/pages/UploadPage";
import { UserPage } from "@/pages/UserPage";
import { EditProfilePage } from "@/pages/EditProfilePage";
import { CollectionPage } from "@/pages/CollectionPage";
import { AdminPage } from "@/pages/AdminPage";
import { DecorPage } from "@/pages/DecorPage";
import { AuthCallbackPage } from "@/pages/AuthCallbackPage";
import { AboutPage } from "@/pages/AboutPage";
import { HelpPage } from "@/pages/HelpPage";
import { FaqPage } from "@/pages/FaqPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { TermsPage } from "@/pages/TermsPage";
import { Home } from "lucide-react";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/design/:id" element={<DesignPage />} />
          <Route path="/design/:id/edit" element={<EditDesignPage />} />
          <Route path="/user/:id" element={<UserPage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/collection/:id" element={<CollectionPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          {/* Info pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/faq" element={<FaqPage />} />
          {/* Legal pages */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          {/* Admin pages */}
          <Route path="/admin" element={<AdminPage />} />
          {/* Game data pages */}
          <Route path="/decor" element={<DecorPage />} />
          {/* 404 fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function NotFoundPage() {
  return (
    <div className="container page-section">
      <div className="placeholder-page">
        <div className="not-found-code font-display">404</div>
        <h2 className="font-display" style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)' }}>
          Page Not Found
        </h2>
        <p className="text-secondary" style={{ marginBottom: 'var(--space-xl)' }}>
          The page you're looking for doesn't exist.
        </p>
        <Link to="/" className="btn btn-primary">
          <Home size={18} />
          Go Home
        </Link>
      </div>
    </div>
  );
}
