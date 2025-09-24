// src/app/routes.tsx
import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./RootLayout";
import { LandingPage } from "./LandingPage";
import { OptimizerPage } from "../features/optimizer/pages/OptimizerPage";
import OptimizerResultPage from "../features/optimizer/pages/OptimizerResultPage";
import { RewardsPage } from "../features/rewards/pages/RewardsPage";
import { ChangelogPage } from "../features/changelog/pages/ChangelogPage";

/* eslint-disable react-refresh/only-export-components */
// Route-level lazy loaders (each returns { Component })
const GuidesPage     = () => import("../features/guides/pages/GuidesIndexPage").then(m => ({ Component: m.default }));
const GuidePostPage  = () => import("../features/guides/pages/GuidePostPage").then(m => ({ Component: m.default }));
const GuideClassSpecPage = () => import("../features/guides/pages/ClassSpecGuidesPage").then(m => ({ Component: m.default }));
const FaqPage        = () => import("../features/faq/pages/FaqPage").then(m => ({ Component: m.default }));
const TermsPage      = () => import("../features/legal/pages/TermsPage").then(m => ({ Component: m.default }));
const PrivacyPage    = () => import("../features/legal/pages/PrivacyPage").then(m => ({ Component: m.default }));
const NotFound       = () => import("./NotFoundPage").then(m => ({ Component: m.default }));

/* eslint-enable react-refresh/only-export-components */

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage />, handle: { noAds: true} },

      // Feature: Optimizer
      { path: "optimizer", element: <OptimizerPage />, handle: { noAds: true} },
      { path: "optimizer/view", element: <OptimizerResultPage /> },

      // Feature: Rewards
      { path: "rewards", element: <RewardsPage /> },

      // Feature: Guides
      { path: "guides",        lazy: GuidesPage },
      { path: "guides/classes/:class/:spec", lazy: GuideClassSpecPage, handle: { noAds: true} },
      { path: "guides/:slug",  lazy: GuidePostPage },

      // Feature: Changelog
      { path: "changelog",     element: <ChangelogPage /> },

      // Misc informational pages
      { path: "faq",           lazy: FaqPage, handle: { noAds: true}   },
      { path: "terms",         lazy: TermsPage, handle: { noAds: true}   },
      { path: "privacy",       lazy: PrivacyPage, handle: { noAds: true}   },

      // 404
      { path: "*", lazy: NotFound, handle: {noAds: true}  },
    ],
  },
]);
