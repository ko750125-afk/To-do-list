import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 일반 크롤러: 전체 허용
      {
        userAgent: "*",
        allow: "/",
      },
      // ✅ Anthropic — Claude 학습 + 실시간 검색 + 인용 허용
      {
        userAgent: "ClaudeBot",
        allow: "/",
      },
      {
        userAgent: "Claude-User",
        allow: "/",
      },
      {
        userAgent: "Claude-SearchBot",
        allow: "/",
      },
      // ✅ OpenAI — ChatGPT 학습 + 실시간 검색 + 인용 허용
      {
        userAgent: "GPTBot",
        allow: "/",
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
      },
      // ✅ Perplexity
      {
        userAgent: "PerplexityBot",
        allow: "/",
      },
      // ✅ Meta AI
      {
        userAgent: "FacebookBot",
        allow: "/",
      },
    ],
    sitemap: "https://todo-premium.vercel.app/sitemap.xml",
  };
}
