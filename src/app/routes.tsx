// src/app/routes.tsx
import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./RootLayout";
import { OptimizerPage } from "../features/optimizer/pages/OptimizerPage";
import OptimizerResultPage from "../features/optimizer/pages/OptimizerResultPage"; // ← add this

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <OptimizerPage /> },
      { path: "/optimizer/view", element: <OptimizerResultPage /> }, // ← new route

      // later extras:
      // { path: "/guides", element: <GuidesIndexPage /> },
      // { path: "/guides/:slug", element: <GuidePage /> },
      // { path: "/blog", element: <BlogIndexPage /> },
      // { path: "/blog/:slug", element: <BlogPostPage /> },
    ],
  },
]);
