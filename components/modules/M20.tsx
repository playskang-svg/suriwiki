"use client";

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
            {/* After Image (Background) */}
            <div className="absolute inset-0 flex items-center justify-center text-outline-variant font-label-caps bg-surface-variant">
              {urlOf(body.compare.after) ? (
                <img src={urlOf(body.compare.after)} alt="시공 후" className="w-full h-full object-cover" />
              ) : (
                <span>AFTER 이미지 준비 중</span>
              )}
            </div>
            
            {/* Before Image (Clipped) */}
            <div 
              className="absolute inset-0 flex items-center justify-center text-outline-variant font-label-caps bg-surface-container-highest overflow-hidden border-r-2 border-white"
              style={{ width: `${sliderPos}%` }}
            >
              {urlOf(body.compare.before) ? (
                <img
                  src={urlOf(body.compare.before)}
                  alt="시공 전"
                  className="h-full max-w-none object-cover"
                  style={{ width: sliderRef.current?.clientWidth ?? "100%" }}
                />
              ) : (
                <span>BEFORE 이미지 준비 중</span>
              )}
            </div>

            {/* Slider Handle */}
            <div 
              className="absolute top-1/2 -mt-4 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-primary cursor-ew-resize"
              style={{ left: `calc(${sliderPos}% - 16px)` }}
              onMouseDown={(e) => {
                const startX = e.clientX;
                const startPos = sliderPos;
                const onMouseMove = (moveEvent: MouseEvent) => {
                  if (!sliderRef.current) return;
                  const rect = sliderRef.current.getBoundingClientRect();
                  const dx = moveEvent.clientX - startX;
                  const dPct = (dx / rect.width) * 100;
                  setSliderPos(Math.max(0, Math.min(100, startPos + dPct)));
                };
                const onMouseUp = () => {
                  document.removeEventListener('mousemove', onMouseMove);
                  document.removeEventListener('mouseup', onMouseUp);
                };
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
              }}
            >
              <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
            </div>
            
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
                <img src={item.url} alt={item.caption} className="w-full h-full object-cover" loading="lazy" />
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
