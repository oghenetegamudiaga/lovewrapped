import fs from 'fs';
import path from 'path';

const DOMAIN = 'https://amorah.xyz';
const TODAY = new Date().toISOString().split('T')[0];

export const PUBLIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/wedding', priority: '0.9', changefreq: 'weekly' },
  { path: '/weddings', priority: '0.9', changefreq: 'weekly' },
  { path: '/love-stories', priority: '0.8', changefreq: 'weekly' },
  { path: '/pricing', priority: '0.8', changefreq: 'weekly' },
  { path: '/blog', priority: '0.7', changefreq: 'daily' },
  { path: '/blog/crafting-the-perfect-digital-wedding-invitation', priority: '0.6', changefreq: 'monthly' },
];

export function generateSitemapXml() {
  const urlEntries = PUBLIC_ROUTES.map((route) => {
    const loc = `${DOMAIN}${route.path}`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
}

export function generateRobotsTxt() {
  return `User-agent: *
Disallow: /admin/
Disallow: /admin
Disallow: /create
Disallow: /preview
Disallow: /pay
Disallow: /w/
Disallow: /weddings/mine
Disallow: /weddings/create
Disallow: /weddings/dashboard/
Disallow: /weddings/login
Disallow: /weddings/signup
Disallow: /dev/

Sitemap: ${DOMAIN}/sitemap.xml
`;
}

export function buildFiles() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sitemapXml = generateSitemapXml();
  const robotsTxt = generateRobotsTxt();

  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  const robotsPath = path.join(publicDir, 'robots.txt');

  fs.writeFileSync(sitemapPath, sitemapXml, 'utf8');
  fs.writeFileSync(robotsPath, robotsTxt, 'utf8');

  console.log('✅ Generated public/sitemap.xml');
  console.log('✅ Generated public/robots.txt');
}

buildFiles();
