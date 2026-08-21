"use client";

import Image from "next/image";
import { ModuleProps } from "@/lib/schemas/modules";
import { useState, useRef, KeyboardEvent } from "react";

export default function M20({ body }: ModuleProps<"M20">) {
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setSliderPos(p => Math.max(0, p - 5));
    if (e.key === 'ArrowRight') setSliderPos(p => Math.min(100, p + 5));
  };

  // compare 는 id 만 갖는다. 실제 URL 은 items 에서 찾는다.
  const urlOf = (variantId: string) =>
    body.items.find(i => i.image_variant_id === variantId)?.url;

  const getFocusLabel = (focus: string) => {
    switch (focus) {
      case 'cause': return '원인 분석';
      case 'judgement': return '진단 포인트';
      case 'process': return '시공 과정';
      case 'result': return '시공 결과';
      default: return '상세 보기';
    }
  };

  return (
    <div className="mb-stack-md">
      <h2 className="font-headline-md text-[24px] text-on-surface mb-stack-md flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">photo_library</span>
        {getFocusLabel(body.focus)}
      </h2>

      {body.compare && (
        <div className="mb-6 bg-surface-clean border border-border-subtle p-2 rounded-xl">
          <div 
            ref={sliderRef}
            className="relative w-full aspect-video md:aspect-[21/9] bg-surface-container rounded-lg overflow-hidden select-none"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label="BEFORE/AFTER 사진 비교 슬라이더 (좌우 화살표 키로 조작)"
          >
            {/* 두 사진을 같은 자리에 겹쳐 두고 BEFORE 쪽만 clip-path 로 잘라 보여준다.
                폭을 계산해 넣던 방식은 컨테이너 크기를 읽어야 해서 리사이즈에 취약했다. */}
            {urlOf(body.compare.after) && (
              <Image
                src={urlOf(body.compare.after)!}
                alt="시공 후"
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover"
              />
            )}
            {urlOf(body.compare.before) && (
              <div
                className="absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <Image
                  src={urlOf(body.compare.before)!}
                  alt="시공 전"
                  fill
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="object-cover"
                />
              </div>
            )}
            <div
              className="absolute inset-y-0 w-0.5 bg-white/90 pointer-events-none"
              style={{ left: `${sliderPos}%` }}
              aria-hidden="true"
            />

            <div className="absolute top-4 left-4 bg-black/60 text-white font-label-caps px-2 py-1 rounded backdrop-blur-sm pointer-events-none">BEFORE</div>
            <div className="absolute top-4 right-4 bg-black/60 text-white font-label-caps px-2 py-1 rounded backdrop-blur-sm pointer-events-none">AFTER</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {body.items.map((item, idx) => (
          <div key={idx} className="bg-surface-clean border border-border-subtle rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="aspect-video bg-surface-container flex items-center justify-center relative">
              {item.url ? (
                <Image
                  src={item.url}
                  alt={item.caption}
                  fill
                  sizes="(max-width: 640px) 100vw, 400px"
                  className="object-cover"
                />
              ) : (
                <span className="font-label-caps text-outline-variant">이미지 준비 중</span>
              )}
              <div className="absolute top-2 left-2 bg-primary text-on-primary font-label-caps px-2 py-1 rounded shadow-sm text-[10px]">
                {item.role}
              </div>
            </div>
            <div className="p-3 bg-surface-clean border-t border-border-subtle">
              <p className="font-body-md text-[14px] text-on-surface">{item.caption}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
