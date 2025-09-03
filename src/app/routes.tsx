// src/app/routes.tsx
import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./RootLayout";
import { OptimizerPage } from "../features/optimizer/pages/OptimizerPage";
import OptimizerResultPage from "../features/optimizer/pages/OptimizerResultPage";
import { LandingPage } from "./LandingPage";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/optimizer", element: <OptimizerPage /> },
      { path: "/optimizer/view", element: <OptimizerResultPage /> },

      // later extras:
      // { path: "/guides", element: <GuidesIndexPage /> },
      // { path: "/guides/:slug", element: <GuidePage /> },
      // { path: "/blog", element: <BlogIndexPage /> },
      // { path: "/blog/:slug", element: <BlogPostPage /> },
    ],
  },
]);
