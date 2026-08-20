'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { caseInputSchema, CaseInputForm, CaseImage } from '@/lib/schemas/case';
import seedData from '@/data/keyword-tree.seed.json';
import { useRouter } from 'next/navigation';

export default function CaseWizard() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<CaseInputForm>({
    resolver: zodResolver(caseInputSchema),
    defaultValues: {
      images: [],
      safety_flags: []
    }
  });

  const watchSpace = watch('space');
  const watchImages = watch('images');
  
  const selectedSpaceDef = seedData.spaces.find((s: any) => s.id === watchSpace);
  const targets = selectedSpaceDef ? selectedSpaceDef.targets : [];

  const onSubmit = (data: CaseInputForm) => {
    // Save as draft to local storage
    const draftId = 'draft_' + Date.now();
    localStorage.setItem(draftId, JSON.stringify(data));
    router.push(`/admin/cases/${draftId}/analyze`);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newImages = Array.from(e.dataTransfer.files).map(f => ({
        id: 'img_' + Math.random().toString(36).substr(2, 9),
        file: f,
        previewUrl: URL.createObjectURL(f),
        must_use: false,
        is_private: false,
        role: 'BEFORE' as any,
        pHash: Math.random() > 0.8 ? 'e8f192' : Math.random().toString(36) // Simulated duplicate pHash
      }));
      setValue('images', [...watchImages, ...newImages].slice(0, 30));
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold border-b pb-2">1. 기본정보</h2>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1">시/도</label>
          <input {...register('area_sido')} className="w-full border p-2 rounded" placeholder="예: 서울특별시" />
          {errors.area_sido && <p className="text-error text-xs mt-1">{errors.area_sido.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">시/군/구</label>
          <input {...register('area_sigungu')} className="w-full border p-2 rounded" placeholder="예: 강남구" />
          {errors.area_sigungu && <p className="text-error text-xs mt-1">{errors.area_sigungu.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">동 (선택)</label>
          <input {...register('area_dong')} className="w-full border p-2 rounded" placeholder="예: 역삼동" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">건물유형</label>
        <select {...register('building_type')} className="w-full border p-2 rounded">
          <option value="">선택</option>
          <option value="아파트">아파트</option>
          <option value="빌라">빌라</option>
          <option value="오피스텔">오피스텔</option>
          <option value="단독">단독</option>
          <option value="상가">상가</option>
        </select>
        {errors.building_type && <p className="text-error text-xs mt-1">{errors.building_type.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1">공간</label>
          <select {...register('space')} className="w-full border p-2 rounded">
            <option value="">선택</option>
            {seedData.spaces.map((s: any) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {errors.space && <p className="text-error text-xs mt-1">{errors.space.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">대상</label>
          <select {...register('target')} className="w-full border p-2 rounded" disabled={!watchSpace}>
            <option value="">선택</option>
            {targets.map((t: any) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          {errors.target && <p className="text-error text-xs mt-1">{errors.target.message}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold border-b pb-2">2. 현장내용</h2>
      <div>
        <label className="block text-sm font-semibold mb-1">문제 (무엇이 어떤 상태였나요?)</label>
        <textarea {...register('problem')} className="w-full border p-2 rounded h-24" />
        {errors.problem && <p className="text-error text-xs mt-1">{errors.problem.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">판단 (무엇을 보고 작업 방향을 정했나요?)</label>
        <textarea {...register('judgement')} className="w-full border p-2 rounded h-24" />
        {errors.judgement && <p className="text-error text-xs mt-1">{errors.judgement.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">실제 작업 (순서를 나열해 주세요)</label>
        <textarea {...register('work_steps')} className="w-full border p-2 rounded h-24" placeholder="예:\n1. 힌지 절단\n2. 철판 부착..." />
        {errors.work_steps && <p className="text-error text-xs mt-1">{errors.work_steps.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">결과 (작업 후 달라진 점)</label>
        <textarea {...register('result')} className="w-full border p-2 rounded h-24" />
        {errors.result && <p className="text-error text-xs mt-1">{errors.result.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">한계 (남은 한계)</label>
        <textarea {...register('limit_note')} className="w-full border p-2 rounded h-16" />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold border-b pb-2">3. 사진 (최대 30장)</h2>
      <div 
        className="border-2 border-dashed border-outline-variant p-8 text-center rounded-xl bg-surface-variant/20 hover:bg-surface-variant/40 cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleImageDrop}
      >
        <p className="text-on-surface-variant font-semibold">이곳에 사진을 드래그&드롭 하세요</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {watchImages.map((img: any, idx: number) => {
          // Detect duplicates
          const isDup = watchImages.filter((i: any) => i.pHash === img.pHash).length > 1;
          
          return (
            <div key={img.id} className="relative border p-2 rounded bg-surface">
              <img src={img.previewUrl} alt="preview" className="w-full h-32 object-cover rounded" />
              {isDup && <span className="absolute top-4 right-4 bg-error text-on-error text-[10px] px-1 rounded">유사 사진</span>}
              <div className="mt-2 space-y-1 text-sm">
                <select 
                  className="w-full border p-1 rounded"
                  value={img.role}
                  onChange={(e) => {
                    const next = [...watchImages];
                    next[idx].role = e.target.value as any;
                    setValue('images', next);
                  }}
                >
                  <option value="BEFORE">BEFORE</option>
                  <option value="PROCESS">PROCESS</option>
                  <option value="AFTER">AFTER</option>
                  <option value="MATERIAL">MATERIAL</option>
                  <option value="TOOL">TOOL</option>
                  <option value="DETAIL">DETAIL</option>
                  <option value="EXCLUDE">EXCLUDE</option>
                </select>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={img.must_use} onChange={(e) => {
                    const next = [...watchImages];
                    next[idx].must_use = e.target.checked;
                    setValue('images', next);
                  }} />
                  <span className="font-semibold text-primary">반드시 사용</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={img.is_private} onChange={(e) => {
                    const next = [...watchImages];
                    next[idx].is_private = e.target.checked;
                    setValue('images', next);
                  }} />
                  <span className="font-semibold text-error">공개 금지</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold border-b pb-2">4. 추가정보 (선택)</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1">원인</label>
          <textarea {...register('cause')} className="w-full border p-2 rounded h-20" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">상황</label>
          <textarea {...register('situation')} className="w-full border p-2 rounded h-20" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">사용된 재료</label>
          <textarea {...register('materials')} className="w-full border p-2 rounded h-20" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">사용된 공구</label>
          <textarea {...register('tools')} className="w-full border p-2 rounded h-20" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">작업 시간/비용(달라지는 이유)</label>
          <textarea {...register('duration_note')} className="w-full border p-2 rounded h-20" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">관리 방법 안내</label>
          <textarea {...register('maintenance')} className="w-full border p-2 rounded h-20" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">안전 위험 플래그 (체크 시 M16 자동 필수)</label>
        <div className="flex flex-wrap gap-4">
          {['electric', 'gas', 'structure', 'severe_leak', 'height'].map(flag => (
            <label key={flag} className="flex items-center gap-2">
              <input type="checkbox" value={flag} {...register('safety_flags')} />
              <span>{flag}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto p-8 font-sans text-on-surface bg-surface shadow-sm rounded-xl">
      <div className="flex justify-between mb-8 border-b pb-4">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`flex-1 text-center font-bold ${step === s ? 'text-primary border-b-4 border-primary' : 'text-on-surface-variant'}`}>
            {s}단계
          </div>
        ))}
      </div>
      
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      <div className="flex justify-between mt-8 pt-4 border-t">
        <button type="button" disabled={step === 1} onClick={() => setStep(s => s - 1)} className="px-6 py-2 border rounded font-bold disabled:opacity-50">
          이전
        </button>
        {step < 4 ? (
          <button type="button" onClick={() => setStep(s => s + 1)} className="px-6 py-2 bg-primary text-on-primary rounded font-bold">
            다음
          </button>
        ) : (
          <button type="submit" className="px-6 py-2 bg-primary text-on-primary rounded font-bold">
            AI 분석 요청
          </button>
        )}
      </div>
    </form>
  );
}
