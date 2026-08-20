import Link from 'next/link';
import Image from 'next/image';

export default function CaseCard({ href, title, imageUrl, date, area, tags }: { href: string, title: string, imageUrl?: string, date?: string, area?: string, tags?: string[] }) {
  return (
    <Link href={href} className="group block bg-surface rounded-xl overflow-hidden shadow-sm border border-outline-variant hover:shadow-md transition-shadow">
      <div className="relative h-48 w-full bg-surface-variant">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant/50">No Image</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-on-surface line-clamp-2 mb-2 group-hover:text-primary transition-colors">{title}</h3>
        <div className="flex items-center text-sm text-on-surface-variant mb-3 space-x-2">
          {area && <span>{area}</span>}
          {area && date && <span className="opacity-50">•</span>}
          {date && <span>{date}</span>}
        </div>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map(t => (
              <span key={t} className="text-xs bg-surface-variant text-on-surface px-2 py-1 rounded">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
