import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumb({ items }: { items: { label: string, href?: string }[] }) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-on-surface-variant my-4">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center">
          {item.href ? (
            <Link href={item.href} className="hover:text-primary transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-on-surface font-medium">{item.label}</span>
          )}
          {idx < items.length - 1 && <ChevronRight className="w-4 h-4 mx-2 opacity-50" />}
        </div>
      ))}
    </nav>
  );
}
