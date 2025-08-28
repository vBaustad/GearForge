// src/app/routes.tsx
import { createBrowserRouter } from "react-router-dom";
import { OptimizerPage } from "../features/optimizer/OptimizerPage";
// import { GuidesIndexPage } from "../features/guides/GuidesIndexPage";
// import { GuidePage } from "../features/guides/GuidePage";
// import { BlogIndexPage } from "../features/blog/BlogIndexPage";
// import { BlogPostPage } from "../features/blog/BlogPostPage";

export const router = createBrowserRouter([
  { path: "/", element: <OptimizerPage /> },
//   { path: "/guides", element: <GuidesIndexPage /> },
//   { path: "/guides/:slug", element: <GuidePage /> },
//   { path: "/blog", element: <BlogIndexPage /> },
//   { path: "/blog/:slug", element: <BlogPostPage /> },
]);
