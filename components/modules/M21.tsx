"use client";

import { ModuleProps } from "@/lib/schemas/modules";
import { useState } from "react";

export default function M21({ body }: ModuleProps<"M21">) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="mb-stack-md">
      <h2 className="font-headline-md text-[24px] text-on-surface mb-stack-md">자주 묻는 질문</h2>
      <div className="flex flex-col gap-2">
        {body.items.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className="bg-surface-clean border border-border-subtle rounded-xl overflow-hidden shadow-sm">
              <button 
                onClick={() => toggle(idx)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-bright transition-colors"
                aria-expanded={isOpen}
              >
                <span className="font-headline-md text-[18px] text-on-surface">Q. {item.q}</span>
                <span className="material-symbols-outlined text-outline-variant shrink-0 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} aria-hidden="true">
                  expand_more
                </span>
              </button>
              {isOpen && (
                <div className="p-4 pt-0 border-t border-border-subtle/30 bg-surface-container-lowest">
                  <p className="font-body-md text-[16px] text-on-surface-variant pt-3 whitespace-pre-wrap">A. {item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
