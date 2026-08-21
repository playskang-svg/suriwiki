import { Metadata } from 'next';
import { PageRecord } from '../types/db';
import { siteConfig } from '@/config/site';

const SITE_URL = siteConfig.brand.site_url;

function truncateTitle(intent: string): string {
  const suffix = ` | ${siteConfig.brand.name}`;
  const base = `${intent}${suffix}`;
  if (base.length > 45) {
    const maxIntentLen = 45 - suffix.length - 3;
    return `${intent.substring(0, maxIntentLen)}...${suffix}`;
  }
  return base;
}

export function buildMetadata(page: PageRecord, m01Body?: Record<string, any>): Metadata {
  const title = truncateTitle(page.search_intent);
  let description = m01Body?.answer || page.meta_description || '';
  if (description.length > 120) {
    description = description.substring(0, 117) + '...';
  }

  // canonicalUrl should ideally be resolved if canonical_page_id exists.
  // Assuming page.slug contains the full path like 'case/xxx' or 'repair/xxx'
  // Or we need a helper to generate slug path. In 11-site-architecture, slug is just the unique ID part or full URL path.
  // Actually, let's assume page.slug is the path without leading slash, e.g., 'wiki/abs-doorframe'
  const canonicalUrl = `${SITE_URL}/${page.slug}`;

  return {
    // absolute 를 쓰지 않으면 layout.tsx 의 template("%s | 브랜드")가 한 번 더 붙어
    // "… | 수리위키 | 수리위키" 가 된다. truncateTitle 이 이미 브랜드를 붙인다.
    title: { absolute: title },
    description,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export function buildJsonLd(page: PageRecord, pageModules: Record<string, any>) {
  const jsonLds: any[] = [];

  // 1. BreadcrumbList
  jsonLds.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "홈",
        "item": SITE_URL
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": page.title,
        "item": `${SITE_URL}/${page.slug}`
      }
    ]
  });

  // 2. FAQPage (M21)
  if (pageModules['M21'] && pageModules['M21'].items) {
    jsonLds.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": pageModules['M21'].items.map((item: any) => ({
        "@type": "Question",
        "name": item.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.a
        }
      }))
    });
  }

  // 3. HowTo (CT2)
  if (page.content_type === 'CT2' && pageModules['M10'] && pageModules['M10'].steps) {
    jsonLds.push({
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": page.title,
      "step": pageModules['M10'].steps.map((step: any) => ({
        "@type": "HowToStep",
        "position": step.n,
        "text": step.title,
        "url": `${SITE_URL}/${page.slug}#step-${step.n}`
      }))
    });
  }

  // 4. Article (CT6 or CASE)
  if (page.content_type === 'CT6' || page.page_type === 'CASE') {
    jsonLds.push({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": page.title,
      "about": {
        "@type": "Thing",
        "name": page.search_intent
      },
      "datePublished": page.published_at || page.created_at,
      "author": {
        "@type": "Organization",
        "name": siteConfig.brand.name
      }
    });
  }

  // 5. LocalBusiness (AREA)
  if (page.page_type === 'AREA') {
    jsonLds.push({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": `${siteConfig.brand.name} - ${page.title}`,
      "areaServed": {
        "@type": "City",
        "name": page.title // In real scenario, extract area name
      }
    });
  }

  return jsonLds;
}
