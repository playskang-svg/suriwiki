import Link from 'next/link';

export default function DesktopNav() {
  return (
    <nav className="hidden md:flex items-center space-x-6 text-on-surface font-medium">
      <Link href="/entrance/firedoor" className="hover:text-primary transition-colors">방화문·현관문</Link>
      <Link href="/entrance/temperedglass" className="hover:text-primary transition-colors">강화도어·유리문</Link>
      <Link href="/bath/doorframe" className="hover:text-primary transition-colors">욕실 문틀</Link>
      <Link href="/kitchen/countertop" className="hover:text-primary transition-colors">싱크대 상판</Link>
      <Link href="/admin/cases/new" className="text-secondary hover:text-secondary-container transition-colors ml-4 text-sm font-bold border border-secondary px-3 py-1 rounded-full">
        Admin
      </Link>
    </nav>
  );
}
