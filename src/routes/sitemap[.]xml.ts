import { createFileRoute } from "@tanstack/react-router";

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/arena", priority: "0.9", changefreq: "hourly" },
  { path: "/insights", priority: "0.8", changefreq: "daily" },
  { path: "/how-it-works", priority: "0.7", changefreq: "monthly" },
  { path: "/for-sponsors", priority: "0.8", changefreq: "monthly" },
  { path: "/about", priority: "0.6", changefreq: "monthly" },
  { path: "/rewards", priority: "0.7", changefreq: "monthly" },
  { path: "/login", priority: "0.4", changefreq: "yearly" },
  { path: "/signup", priority: "0.6", changefreq: "yearly" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = new URL(request.url).origin;
        const today = new Date().toISOString().slice(0, 10);
        const urls = STATIC_ROUTES.map(
          (r) => `  <url>
    <loc>${origin}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
        ).join("\n");
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
        return new Response(body, {
          headers: { "content-type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
