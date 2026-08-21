/**
 * area-content.ts — 지역 페이지 본문을 시드 택소노미에서 만든다.
 *
 * 지역 페이지가 "사례 없음" 한 줄이면 검색엔진에는 빈 문서고 방문자에게도 쓸모가 없다.
 * 그렇다고 시공 실적을 지어내면 표시광고법 문제이자 이 제품의 존재 이유를 깨는 일이다.
 *
 * 그래서 **지역 × 수리 항목** 조합의 정보성 콘텐츠를 만든다.
 * 재료는 전부 data/keyword-tree.seed.json 에 이미 정의된 것이다 —
 * 어떤 대상(L2)이 지역 확장 대상인지, 그 대상에 어떤 증상(L3)이 흔한지,
 * 검색량 힌트가 어떤지가 시드에 들어 있다. 새로 지어내는 문장이 아니라
 * 이미 정리된 택소노미를 지역 이름과 엮어 문서로 펴는 것이다.
 *
 * 시공 사례는 실제 발행된 것만, 어느 지역 사례인지 밝혀서 연결한다.
 */
import seed from '@/data/keyword-tree.seed.json';

export type RepairTopic = {
  spaceId: string;
  spaceLabel: string;
  targetId: string;
  targetLabel: string;
  /** 이 대상에서 흔한 증상들 */
  problems: { id: string; label: string }[];
  volume: 'high' | 'mid' | 'low';
};

const VOLUME_RANK: Record<string, number> = { high: 0, mid: 1, low: 2 };

/**
 * 지역 페이지에 실을 수리 항목.
 *
 * 시드에서 `area_expandable: true` 인 대상만 고른다 —
 * 지역과 엮어 페이지를 만들어도 되는 대상이라고 택소노미가 이미 표시해 둔 것들이다.
 * (실리콘·수전처럼 지역성이 없는 대상은 시드에서 false 로 되어 있어 빠진다.)
 */
export function getAreaRepairTopics(limit = 8): RepairTopic[] {
  const topics: RepairTopic[] = [];

  for (const space of (seed as any).spaces ?? []) {
    for (const target of space.targets ?? []) {
      if (!target.area_expandable) continue;
      topics.push({
        spaceId: space.id,
        spaceLabel: space.label,
        targetId: target.id,
        targetLabel: target.label,
        problems: (target.problems ?? []).map((p: any) => ({ id: p.id, label: p.label })),
        volume: (target.volume_hint ?? 'low') as RepairTopic['volume'],
      });
    }
  }

  return topics
    .sort((a, b) => (VOLUME_RANK[a.volume] ?? 3) - (VOLUME_RANK[b.volume] ?? 3))
    .slice(0, limit);
}

/** 메타 설명·제목에 쓸 대표 수리 항목 이름들 */
export function topicHeadline(topics: RepairTopic[], count = 3): string {
  return topics.slice(0, count).map(t => t.targetLabel).join(' · ');
}

/**
 * 부분 수리로 접근하는 판단 기준.
 *
 * 이 사이트의 일관된 입장이라 지역과 무관하게 같다.
 * 지역마다 다른 것처럼 쓰면 그게 오히려 지어낸 문장이 된다.
 */
export const REPAIR_CRITERIA = [
  {
    title: '손상이 한 부위에 몰려 있는가',
    desc: '문틀 하부처럼 한 곳만 상했다면 그 부분만 잘라내고 이어 붙이는 편이 전체 교체보다 낫습니다.',
  },
  {
    title: '뼈대가 살아 있는가',
    desc: '프레임이나 골조가 버티고 있으면 표면과 부속만 손봐도 기능이 돌아옵니다. 뼈대가 무너졌으면 교체가 맞습니다.',
  },
  {
    title: '같은 자재를 구할 수 있는가',
    desc: '단종된 자재는 색과 질감을 맞추기 어렵습니다. 조색으로 이어붙일 수 있는지가 부분 수리의 갈림길입니다.',
  },
  {
    title: '안전에 걸리는 문제인가',
    desc: '방화문 힌지 파손처럼 안전과 직결된 것은 부분 보수로 넘기지 않고 교체를 권합니다.',
  },
];
