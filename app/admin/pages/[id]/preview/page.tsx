'use client';

import { useEffect, useState, use } from 'react';

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Preview page generation based on the case
    setTimeout(() => {
      setPages([
        { id: 'p1', title: '욕실 문틀 하부 썩음 수리 사례', type: 'CASE', decision: 'CREATE', gate: 'PASS' },
        { id: 'p2', title: '강남구 욕실 문틀 수리', type: 'AREA', decision: 'CREATE', gate: 'PASS' },
        { id: 'p3', title: '문틀 부분수리와 전체교체', type: 'WIKI', decision: 'MERGE', gate: 'PASS' },
      ]);
      setLoading(false);
    }, 1500);
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center mt-20">
        <h2 className="text-2xl font-bold animate-pulse">페이지를 조립하고 품질 게이트를 통과 중입니다...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 font-sans text-on-surface">
      <h1 className="text-3xl font-bold mb-8 border-b pb-4">페이지 발행 미리보기 (Screen 7)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pages.map(p => (
          <div key={p.id} className="border border-outline-variant rounded-xl overflow-hidden bg-surface shadow-sm">
            <div className="p-4 border-b bg-surface-variant flex justify-between items-center">
              <span className="font-bold text-sm bg-primary text-on-primary px-2 py-1 rounded">{p.type}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded ${p.decision === 'CREATE' ? 'bg-secondary text-on-secondary' : 'bg-tertiary text-on-tertiary'}`}>
                {p.decision}
              </span>
            </div>
            <div className="p-4 space-y-4">
              <h3 className="font-bold text-lg">{p.title}</h3>
              <div className="flex gap-2">
                <span className="text-xs bg-success/20 text-success px-2 py-1 rounded font-bold">게이트 {p.gate}</span>
              </div>
              <div className="h-32 bg-surface-variant rounded border-dashed border-2 flex items-center justify-center text-sm text-on-surface-variant">
                (드래그 & 드롭하여 모듈 순서 변경 가능 - Preview)
              </div>
            </div>
            <div className="p-4 border-t bg-surface-variant/30 flex justify-end">
              <button className="text-primary font-bold text-sm hover:underline">발행 대기열 추가</button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 flex justify-end">
         <button className="px-8 py-3 bg-primary text-on-primary font-bold rounded-lg shadow-md hover:opacity-90">
           일괄 발행하기
         </button>
      </div>
    </div>
  );
}
