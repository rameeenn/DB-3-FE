// app/api/proxy-image/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  // 1. Validate the URL parameter
  if (!url) {
    return NextResponse.json({ error: 'Missing "url" parameter' }, { status: 400 });
  }

  // 2. Security: Only allow specific domains to prevent abuse (CRITICAL!)
  //    Add your database's image domain here.
  const allowedDomains = ['gwp.dhakarachi.org', 'sdga-apistagging.dhakarachi.org', 'dfpwebp.dhakarachi.org', 'dhakarachi.org',];
  try {
    const urlObj = new URL(url);
    if (!allowedDomains.some(domain => urlObj.hostname === domain)) {
      console.error(`Blocked attempt to proxy unauthorized domain: ${urlObj.hostname}`);
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    // 3. The server fetches the image. This works even if the client can't reach it.
    const response = await fetch(url);
    
    if (!response.ok) {
      return new NextResponse('Image not found', { status: response.status });
    }

    // 4. Return the image data to the client.
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Proxy image error:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}