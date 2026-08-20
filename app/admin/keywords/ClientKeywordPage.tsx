'use client';

import { useState, useMemo } from 'react';

type NodeStatus = 'OPEN' | 'CLAIMED' | 'PUBLISHED' | 'HOLD' | 'MERGED';

export default function ClientKeywordPage({ initialNodes }: { initialNodes: any[] }) {
  const [activeTab, setActiveTab] = useState<'TREE' | 'QUEUE' | 'REPORT'>('TREE');
  const [statusFilter, setStatusFilter] = useState<NodeStatus | 'ALL'>('ALL');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredNodes = useMemo(() => {
    if (statusFilter === 'ALL') return initialNodes;
    return initialNodes.filter(n => n.status === statusFilter);
  }, [initialNodes, statusFilter]);

  // Build tree
  const tree = useMemo(() => {
    const rootNodes = filteredNodes.filter(n => n.level === 1);
    
    const getChildren = (parentId: string) => {
      return filteredNodes.filter(n => n.parent_id === parentId);
    };

    const renderNode = (node: any) => {
      const children = getChildren(node.id);
      const isExpanded = expanded[node.id];
      
      return (
        <div key={node.id} className="ml-6 border-l pl-4 my-2 border-outline-variant">
          <div className="flex items-center gap-4">
            {children.length > 0 && (
              <button onClick={() => toggleExpand(node.id)} className="text-primary font-bold w-4">
                {isExpanded ? '-' : '+'}
              </button>
            )}
            <span className="font-mono text-sm text-on-surface-variant w-12">{node.priority_score}</span>
            <span className="font-semibold text-on-surface w-48 truncate" title={node.id}>{node.id}</span>
            <span className="w-48 truncate">{node.query_ko}</span>
            <span className="text-xs bg-surface-variant px-2 py-1 rounded w-16 text-center">{node.suggested_ct || '-'}</span>
            <span className="text-xs bg-surface-variant px-2 py-1 rounded w-20 text-center">{node.suggested_page_type || '-'}</span>
            <span className="text-xs w-16">CASE: {node.evidence_case_ids?.length || 0}</span>
            <span className={`text-xs px-2 py-1 rounded font-bold ${
              node.status === 'OPEN' ? 'bg-primary text-on-primary' :
              node.status === 'HOLD' ? 'bg-error text-on-error' :
              'bg-secondary text-on-secondary'
            }`}>{node.status}</span>
            {node.status === 'HOLD' && node.hold_reason && (
              <span className="text-xs text-error bg-error-container px-2 py-1 rounded truncate flex-1">
                {node.hold_reason}
              </span>
            )}
          </div>
          {isExpanded && children.length > 0 && (
            <div className="mt-2">
              {children.map(renderNode)}
            </div>
          )}
        </div>
      );
    };

    return rootNodes.map(renderNode);
  }, [filteredNodes, expanded]);

  const queueNodes = useMemo(() => {
    return initialNodes
      .filter(n => n.status === 'OPEN' && n.level > 1) // level 1 are space
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, 30);
  }, [initialNodes]);

  const holdNodes = useMemo(() => {
    return initialNodes.filter(n => n.status === 'HOLD');
  }, [initialNodes]);

  const exportCSV = () => {
    const header = 'ID,Score,Query,HoldReason\n';
    const rows = holdNodes.map(n => `${n.id},${n.priority_score},"${n.query_ko}","${n.hold_reason}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hold_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans text-on-surface">
      <h1 className="text-2xl font-bold mb-6">키워드 트리 관리 ({initialNodes.length}개 노드)</h1>
      
      <div className="flex gap-4 mb-6 border-b border-outline-variant pb-2">
        <button className={`px-4 py-2 font-semibold ${activeTab === 'TREE' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant'}`} onClick={() => setActiveTab('TREE')}>전체 트리 뷰</button>
        <button className={`px-4 py-2 font-semibold ${activeTab === 'QUEUE' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant'}`} onClick={() => setActiveTab('QUEUE')}>이번 주 큐</button>
        <button className={`px-4 py-2 font-semibold ${activeTab === 'REPORT' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant'}`} onClick={() => setActiveTab('REPORT')}>필요 근거 리포트</button>
      </div>

      {activeTab === 'TREE' && (
        <div>
          <div className="flex gap-2 mb-6 items-center">
            <span className="font-bold text-sm">상태 필터:</span>
            {['ALL', 'OPEN', 'HOLD', 'CLAIMED', 'PUBLISHED', 'MERGED'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s as any)}
                className={`text-xs px-3 py-1 rounded-full border ${statusFilter === s ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant">
            {tree.length > 0 ? tree : <p className="text-on-surface-variant text-sm">표시할 노드가 없습니다.</p>}
          </div>
        </div>
      )}

      {activeTab === 'QUEUE' && (
        <div>
          <h2 className="text-xl font-bold mb-4">이번 주 생성 큐 (우선순위 상위 30개)</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant text-sm">
                <th className="py-2 w-16">순위</th>
                <th className="py-2 w-20">점수</th>
                <th className="py-2 w-64">노드 ID</th>
                <th className="py-2">검색 질문</th>
                <th className="py-2 w-20">CT</th>
                <th className="py-2 w-24">Type</th>
              </tr>
            </thead>
            <tbody>
              {queueNodes.map((n, i) => (
                <tr key={n.id} className="border-b border-outline-variant/50 text-sm hover:bg-surface-variant/30">
                  <td className="py-2 font-bold">{i + 1}</td>
                  <td className="py-2 font-mono text-primary">{n.priority_score}</td>
                  <td className="py-2 text-on-surface-variant">{n.id}</td>
                  <td className="py-2 font-semibold">{n.query_ko}</td>
                  <td className="py-2">{n.suggested_ct}</td>
                  <td className="py-2">{n.suggested_page_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'REPORT' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">근거 부족 (HOLD) 노드: {holdNodes.length}개</h2>
            <button onClick={exportCSV} className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:opacity-90">
              CSV 내보내기
            </button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant text-sm">
                <th className="py-2 w-20">점수</th>
                <th className="py-2 w-64">노드 ID</th>
                <th className="py-2 w-64">검색 질문</th>
                <th className="py-2">HOLD 사유 (현장팀 요청 내용)</th>
              </tr>
            </thead>
            <tbody>
              {holdNodes.map((n) => (
                <tr key={n.id} className="border-b border-outline-variant/50 text-sm hover:bg-error-container/30">
                  <td className="py-2 font-mono text-on-surface-variant">{n.priority_score}</td>
                  <td className="py-2">{n.id}</td>
                  <td className="py-2 font-semibold">{n.query_ko}</td>
                  <td className="py-2 text-error font-bold">{n.hold_reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
