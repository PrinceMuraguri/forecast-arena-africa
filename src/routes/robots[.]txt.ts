import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = new URL(request.url).origin;
        const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /wallet
Disallow: /sponsor
Disallow: /reset-password

Sitemap: ${origin}/sitemap.xml
`;
        return new Response(body, {
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});
