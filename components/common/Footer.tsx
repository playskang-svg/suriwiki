import Link from 'next/link';
import { siteConfig } from '../../config/site';

export default function Footer() {
  return (
    <footer className="bg-surface text-on-surface border-t border-outline-variant py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold mb-4">{siteConfig.brand.name}</h2>
            <p className="text-sm text-on-surface-variant mb-2">대표: {siteConfig.contact.owner}</p>
            <p className="text-sm text-on-surface-variant mb-2">사업자등록번호: {siteConfig.contact.biz_no}</p>
            <p className="text-sm text-on-surface-variant mb-2">주소: {siteConfig.contact.address}</p>
            <p className="text-sm text-on-surface-variant">이메일: {siteConfig.contact.email}</p>
          </div>
          <div className="flex flex-col md:items-end justify-center">
            <a href={`tel:${siteConfig.contact.phone.replace(/[^0-9]/g, '')}`} className="text-2xl font-bold text-primary mb-2">
              {siteConfig.contact.phone}
            </a>
            <p className="text-sm text-on-surface-variant mb-4">{siteConfig.contact.business_hours}</p>
            <div className="flex space-x-4">
              <Link href="/terms" className="text-sm hover:underline text-on-surface-variant">이용약관</Link>
              <Link href="/privacy" className="text-sm hover:underline font-bold text-on-surface-variant">개인정보처리방침</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-outline-variant text-center text-xs text-on-surface-variant">
          &copy; {new Date().getFullYear()} {siteConfig.brand.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
