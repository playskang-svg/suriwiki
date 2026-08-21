import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { siteConfig } from '@/config/site';
import { pingIndexNow } from '@/lib/seo/indexnow';

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-revalidate-secret');
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const payload = await req.json();

    if (payload.table === 'pages' && payload.record?.slug) {
      const path = `/${payload.record.slug}`;
      revalidatePath(path);

      // 새 페이지가 목록에 반영되도록 사이트맵·피드도 같이 무효화한다.
      // 이걸 빼면 페이지는 살아 있는데 사이트맵에는 최대 1시간 동안 안 보인다.
      revalidatePath('/sitemap.xml');
      revalidatePath('/rss.xml');

      // 발행된 것만 알린다. draft·review 를 알리면 검색엔진이 404 를 가지러 온다.
      let indexnow = null;
      if (payload.record.status === 'published') {
        indexnow = await pingIndexNow([`${siteConfig.brand.site_url}${path}`]);
      }

      return NextResponse.json({
        revalidated: true,
        path,
        // null 이면 키 미설정이다. 성공한 척하지 않고 그대로 돌려준다.
        indexnow,
      });
    }

    return NextResponse.json({ message: 'No valid page to revalidate' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating', error: String(err) }, { status: 500 });
  }
}
