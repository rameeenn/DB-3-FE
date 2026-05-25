// app/api/proxy-image/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Basic URL validation
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  // Optional: whitelist allowed domains
  const allowedDomains = ['gwp.dhakarachi.org'];
  if (!allowedDomains.includes(parsedUrl.hostname)) {
    return new NextResponse('Domain not allowed', { status: 403 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        // Mimic a real browser request — many servers block requests without these
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': parsedUrl.origin,
        'Cache-Control': 'no-cache',
      },
      // In some Next.js/Node environments you may need this to bypass SSL issues:
      // @ts-ignore
      // agent: new (require('https').Agent)({ rejectUnauthorized: false })
    });

    if (!response.ok) {
      console.error(`Proxy fetch failed: ${response.status} ${response.statusText} for ${imageUrl}`);
      return new NextResponse(`Upstream error: ${response.status}`, { status: 502 });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        // Allow the card download (html2canvas/dom-to-image) to read this
        'Access-Control-Allow-Origin': '*',
      },
    });
  }catch (error: any) {
  console.error('Proxy error details:', {
    message: error.message,
    cause: error.cause,
    url: imageUrl,
  });
  return new NextResponse(error.message, { status: 500 });
}
}