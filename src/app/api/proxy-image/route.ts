// app/api/proxy-image/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  
  console.log('[proxy-image] Requested URL:', url);

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    // Validate URL to prevent malicious requests
    const urlObj = new URL(url);
    const allowedDomains = ['gwp.dhakarachi.org', 'dfpwebp.dhakarachi.org', 'sdga-apistagging.dhakarachi.org'];
    
    if (!allowedDomains.some(domain => urlObj.hostname === domain)) {
      console.error('[proxy-image] Blocked domain:', urlObj.hostname);
      return new NextResponse('Domain not allowed', { status: 403 });
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store',
    });

    console.log('[proxy-image] Response status:', response.status);

    if (!response.ok) {
      console.error(`[proxy-image] Upstream ${response.status} for ${url}`);
      // Return default image from local public folder
      const defaultImagePath = new URL('/card-templates/defaultprofilepic.jpg', request.url);
      const defaultResponse = await fetch(defaultImagePath);
      const defaultBuffer = await defaultResponse.arrayBuffer();
      return new NextResponse(defaultBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });

  } catch (err: any) {
    console.error('[proxy-image] ERROR:', err.message);
    // Return default image on any error
    try {
      const defaultImagePath = new URL('/card-templates/defaultprofilepic.jpg', request.url);
      const defaultResponse = await fetch(defaultImagePath);
      const defaultBuffer = await defaultResponse.arrayBuffer();
      return new NextResponse(defaultBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (fallbackError) {
      return new NextResponse('Image not available', { status: 404 });
    }
  }
}