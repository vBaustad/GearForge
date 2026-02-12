import type { Metadata } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { BlogPostClient } from "./BlogPostClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return { title: "Blog Post" };
    }

    const client = new ConvexHttpClient(convexUrl);
    const post = await client.query(api.blog.getBySlug, { slug });

    if (!post) {
      return {
        title: "Post Not Found",
        description: "This blog post doesn't exist.",
      };
    }

    return {
      title: post.title,
      description: post.excerpt,
      keywords: post.tags,
      openGraph: {
        type: "article",
        title: post.title,
        description: post.excerpt,
        images: post.coverUrl ? [{ url: post.coverUrl }] : undefined,
        publishedTime: post.publishedAt
          ? new Date(post.publishedAt).toISOString()
          : undefined,
        authors: [post.authorName],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt,
        images: post.coverUrl ? [post.coverUrl] : undefined,
      },
    };
  } catch {
    return { title: "Blog Post" };
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BlogPostClient slug={slug} />;
}
