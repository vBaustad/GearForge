// src/app/routes.tsx
import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./RootLayout";
import { LandingPage } from "./LandingPage";
import { OptimizerPage } from "../features/optimizer/pages/OptimizerPage";
import OptimizerResultPage from "../features/optimizer/pages/OptimizerResultPage";
import { RewardsPage } from "../features/rewards/pages/RewardsPage";

/* eslint-disable react-refresh/only-export-components */
// Route-level lazy loaders (each returns { Component })
const GuidesPage  = () => import("./pages/guides/GuidesPage").then(m => ({ Component: m.default }));
const FaqPage     = () => import("./pages/faq/FaqPage").then(m => ({ Component: m.default }));
const TermsPage   = () => import("./pages/legal/TermsPage").then(m => ({ Component: m.default }));
const PrivacyPage = () => import("./pages/legal/PrivacyPage").then(m => ({ Component: m.default }));
const NotFound    = () => import("./pages/NotFoundPage").then(m => ({ Component: m.default }));
/* eslint-enable react-refresh/only-export-components */

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },

      // Feature: Optimizer
      { path: "optimizer", element: <OptimizerPage /> },
      { path: "optimizer/view", element: <OptimizerResultPage /> },
      { path: "rewards", element: <RewardsPage /> },

      // Site pages (lazy)
      { path: "guides",  lazy: GuidesPage },
      { path: "faq",     lazy: FaqPage },
      { path: "terms",   lazy: TermsPage },
      { path: "privacy", lazy: PrivacyPage },

      // 404
      { path: "*", lazy: NotFound },
    ],
  },
]);
