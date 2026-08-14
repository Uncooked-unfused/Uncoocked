import { NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'https://uncoocked-prototype.vercel.app';

  const staticRoutes = [
    '',
    '/event',
    '/about',
    '/contact',
    '/opportunities',
    '/login',
    '/signup',
  ];

  let eventIds = [];
  try {
    const events = await prisma.event.findMany({
      where: { archived: false, status: 'Active' },
      select: { id: true },
    });
    eventIds = events.map((e) => e.id);
  } catch (error) {
    console.error('Error fetching events for XML sitemap:', error);
  }

  const staticUrls = staticRoutes
    .map(
      (route) => `
  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>daily</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`
    )
    .join('');

  const eventUrls = eventIds
    .map(
      (id) => `
  <url>
    <loc>${baseUrl}/event?id=${id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${eventUrls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
