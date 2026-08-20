'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalyzePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'done'>('loading');

  useEffect(() => {
    const draft = localStorage.getItem(id);
    if (draft) {
      setData(JSON.parse(draft));
      // Simulate AI analysis delay
      setTimeout(() => {
        setAnalysis({
          structured_problem: "문제가 구조화됨",
          suggested_keywords: ["bath.doorframe.rot#judge"],
          quality_score: 95
        });
        setStatus('done');
      }, 2000);
    }
  }, [id]);

  if (!data) return <div className="p-8">Draft not found...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 font-sans text-on-surface">
      <h1 className="text-3xl font-bold mb-8">AI 구조화 분석 (단계 5~6)</h1>
      
      {status === 'loading' ? (
        <div className="bg-surface-variant p-8 rounded-xl text-center">
          <p className="animate-pulse font-bold text-xl">AI가 CASE를 구조화하고 있습니다...</p>
          <p className="mt-2 text-on-surface-variant text-sm">잠시만 기다려주세요.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-xl shadow-sm border border-outline-variant">
            <h2 className="text-xl font-bold mb-4">분석 결과 확인 (Screen 6)</h2>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div className="border p-4 rounded">
                <h3 className="font-bold text-primary mb-2">원문 (문제)</h3>
                <p>{data.problem}</p>
              </div>
              <div className="border p-4 rounded bg-primary/5">
                <h3 className="font-bold text-primary mb-2">구조화된 텍스트</h3>
                <p>{analysis.structured_problem}</p>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-2">추천 키워드 바인딩</h3>
              <div className="flex gap-2">
                {analysis.suggested_keywords.map((k: string) => (
                  <span key={k} className="px-3 py-1 bg-secondary text-on-secondary rounded-full text-xs font-bold">{k}</span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-4 mt-8">
            <button onClick={() => router.back()} className="px-6 py-2 border rounded font-bold">수정하기</button>
            <button onClick={() => {
              // Mark as approved (temporary state)
              data.status = 'approved';
              localStorage.setItem(id, JSON.stringify(data));
              router.push(`/admin/pages/${id}/preview`);
            }} className="px-6 py-2 bg-primary text-on-primary rounded font-bold">승인 및 페이지 생성</button>
          </div>
        </div>
      )}
    </div>
  );
}
