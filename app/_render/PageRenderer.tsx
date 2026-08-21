import { ModuleRegistry, assertAllModulesRegistered } from "@/components/modules/registry";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import Link from "next/link";
import { siteConfig } from "@/config/site";

assertAllModulesRegistered();

type PageModules = Record<string, any>;

interface PageRendererProps {
  title: string;
  moduleOrder: string[];
  pageModules: PageModules;
  /** 빵부스러기용. 없으면 홈 링크만 보여준다. */
  breadcrumb?: { label: string; href?: string }[];
}

/**
 * 콘텐츠 페이지(CASE·WIKI·LANDING·AREA)의 껍데기 + 모듈 렌더링.
 *
 * 원래는 모듈만 렌더했다. 그래서 홈 말고 모든 페이지에 헤더도 하단 네비도 없었고,
 * 페이지에 들어가면 홈으로 돌아갈 방법이 없었다. 껍데기를 여기서 붙인다 —
 * PageRenderer 를 쓰는 7개 라우트가 한 번에 같은 구조를 갖는다.
 */
export default function PageRenderer({ title, moduleOrder, pageModules, breadcrumb }: PageRendererProps) {
  const telHref = `tel:${siteConfig.contact.phone.replace(/[^0-9]/g, "")}`;

  return (
    <>
      <Header />
      <main className="flex flex-col relative w-full pt-16 pb-32 bg-surface">
        <div className="w-full max-w-4xl mx-auto px-grid-margin-mobile md:px-grid-margin-desktop">
          <nav aria-label="위치" className="py-stack-md flex items-center gap-1.5 flex-wrap text-status-label font-status-label text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">홈</Link>
            {(breadcrumb ?? []).map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                {b.href ? (
                  <Link href={b.href} className="hover:text-primary transition-colors">{b.label}</Link>
                ) : (
                  <span className="text-on-surface">{b.label}</span>
                )}
              </span>
            ))}
          </nav>

          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-stack-md break-keep">
            {title}
          </h1>

          <div className="flex flex-col">
            {moduleOrder.map((code, idx) => {
              const ModuleComponent = ModuleRegistry[code];
              const body = pageModules[code];

              if (!ModuleComponent) {
                console.warn(`Module ${code} not found in registry.`);
                return null;
              }

              if (!body) {
                // 근거 데이터가 없으면 렌더링하지 않음
                return null;
              }

              return <ModuleComponent key={`${code}-${idx}`} body={body} />;
            })}
          </div>

          {/* 콘텐츠 끝에서 막다른 길이 되지 않도록 전환 경로를 둔다. */}
          <section className="mt-stack-lg bg-primary-container rounded-2xl p-stack-lg text-center">
            <p className="font-body-md text-on-primary-container mb-stack-md break-keep">
              같은 증상인지 확인이 필요하시면 사진 한 장만 보내주세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={telHref} className="bg-primary text-on-primary px-6 py-3 rounded-xl font-headline-md flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
                <span className="material-symbols-outlined text-[20px]">call</span>
                {siteConfig.contact.phone}
              </a>
              <Link href="/" className="bg-on-primary text-primary px-6 py-3 rounded-xl font-headline-md flex items-center justify-center gap-2 hover:bg-surface-clean transition-colors">
                <span className="material-symbols-outlined text-[20px]">home</span>
                홈으로
              </Link>
            </div>
          </section>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
