#!/usr/bin/env bash
#
# push-env-to-vercel.sh — .env.local 의 환경변수를 Vercel 에 일괄 반영한다.
#
# 대시보드에서 하나씩 복사·붙여넣기 하면 값이 잘못 들어가기 쉽고(명령어를 통째로
# 붙여넣는 사고가 실제로 났다), 세 환경에 빠짐없이 넣었는지도 확인이 어렵다.
# 로컬 .env.local 을 단일 출처로 삼아 그대로 밀어 넣는다.
#
# 사용:
#   npm run env:push              # 무엇이 반영될지 보여주기만 한다 (기본)
#   npm run env:push -- --apply   # 실제로 반영한다
#
# 사전 조건: npx vercel link 로 프로젝트가 연결돼 있어야 한다 (.vercel/project.json).
#
# 값은 화면에 찍지 않는다. 어떤 변수를 어느 환경에 넣는지만 보여준다.

set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE=".env.local"
APPLY=false
[[ "${1:-}" == "--apply" ]] && APPLY=true

# Vercel 에 올릴 변수. .env.local 의 모든 것을 올리지 않는다 —
# VERCEL_OIDC_TOKEN 처럼 Vercel 이 스스로 주입하는 값까지 덮어쓰면 안 된다.
VARS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  REVALIDATE_SECRET
  INDEXNOW_KEY
  NEXT_PUBLIC_NAVER_SITE_VERIFICATION
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  NEXT_PUBLIC_BING_SITE_VERIFICATION
)

TARGETS=(production preview development)

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE 이 없습니다." >&2
  exit 1
fi

if [[ ! -f ".vercel/project.json" ]]; then
  echo "ERROR: Vercel 프로젝트가 연결돼 있지 않습니다." >&2
  echo "       npx vercel link --yes --scope <team> --project <name> 을 먼저 실행하세요." >&2
  exit 1
fi

read_value() {
  # 값에 = 가 들어있을 수 있으므로 첫 = 만 기준으로 자른다. 앞뒤 따옴표는 제거한다.
  sed -n "s/^$1=//p" "$ENV_FILE" | head -1 | sed -e 's/^"//' -e 's/"$//'
}

echo "대상 파일 : $ENV_FILE"
echo "대상 환경 : ${TARGETS[*]}"
$APPLY || echo "모드      : 미리보기 (실제 반영하려면 --apply)"
echo

pushed=0
skipped=0

for key in "${VARS[@]}"; do
  value="$(read_value "$key" || true)"

  if [[ -z "$value" ]]; then
    # 값이 없는 것은 에러가 아니다 — 아직 발급 전인 선택 변수일 수 있다.
    printf '  %-38s (비어 있음 — 건너뜀)\n' "$key"
    skipped=$((skipped + 1))
    continue
  fi

  if ! $APPLY; then
    printf '  %-38s → %s\n' "$key" "${TARGETS[*]}"
    pushed=$((pushed + 1))
    continue
  fi

  for target in "${TARGETS[@]}"; do
    # 이미 있으면 지우고 다시 넣는다. add 만으로는 기존 값이 남는다.
    npx vercel env rm "$key" "$target" --yes >/dev/null 2>&1 || true
    printf '%s' "$value" | npx vercel env add "$key" "$target" >/dev/null 2>&1
  done
  printf '  %-38s ✓ %s\n' "$key" "${TARGETS[*]}"
  pushed=$((pushed + 1))
done

echo
if $APPLY; then
  echo "✓ 반영 ${pushed}개 · 건너뜀 ${skipped}개"
  echo "  적용하려면 재배포가 필요합니다 (git push 또는 대시보드 Redeploy)."
else
  echo "미리보기 ${pushed}개 · 건너뜀 ${skipped}개"
  echo "실제로 반영하려면: npm run env:push -- --apply"
fi
