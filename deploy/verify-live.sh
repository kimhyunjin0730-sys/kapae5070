#!/usr/bin/env bash
# 배포 후 점검 — 어디서든 실행 가능 (서버 접속 불필요)
#   bash deploy/verify-live.sh                      # 기본: https://kapae5070.org
#   bash deploy/verify-live.sh http://127.0.0.1:3000
BASE="${1:-https://kapae5070.org}"
BASE="${BASE%/}"
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "  OK    $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  FAIL  $1"; }
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

fetch() { # path -> sets CODE, BODY file
  CODE=$(curl -s -m 15 -o "$TMP/body" -w "%{http_code}" "$BASE$1")
}

echo "점검 대상: $BASE"
echo
echo "[1] 사이트·API 동작"
fetch /
[ "$CODE" = 200 ] && cp "$TMP/body" "$TMP/index" && ok "메인 페이지 200" || bad "메인 페이지 → $CODE"
fetch /notice.html; [ "$CODE" = 200 ] && ok "알림마당 페이지 200" || bad "알림마당 페이지 → $CODE"
fetch /api/health
if [ "$CODE" = 200 ] && grep -q '"ok":true' "$TMP/body"; then ok "/api/health (서버·DB 정상)"
else bad "/api/health → $CODE $(head -c 80 "$TMP/body" | tr '\n' ' ')  (502면 Node 꺼짐, 503이면 DB 문제)"; fi
fetch /api/notices
if [ "$CODE" = 200 ] && head -c 1 "$TMP/body" | grep -q '\['; then ok "/api/notices 공지 목록"
else bad "/api/notices → $CODE"; fi

echo
echo "[2] 서버 파일 비노출 (403/404이거나 메인 페이지와 같으면 정상)"
for p in /.env /.env.example /.git/config /.git/HEAD /database.js /server.js /package.json \
         /init.sql /kapae.sqlite /db_cmd.bat /RESEARCH.MD /backend_test/server.js \
         /services/geminiService.js /deploy/kapae5070.service; do
  fetch "$p"
  if [ "$CODE" = 403 ] || [ "$CODE" = 404 ]; then ok "$p → $CODE"
  elif [ "$CODE" = 200 ] && [ -f "$TMP/index" ] && cmp -s "$TMP/body" "$TMP/index"; then ok "$p → 메인 페이지로 대체"
  elif [ "$CODE" = 200 ]; then bad "$p 가 그대로 다운로드됨 ($(wc -c < "$TMP/body")B)"
  else bad "$p → $CODE (확인 필요)"; fi
done

echo
echo "[3] 관리자 API 보호 (새 코드 배포 여부)"
CODE=$(curl -s -m 15 -o /dev/null -w "%{http_code}" -X POST -H 'Content-Type: application/json' \
  -d '{"title":"verify","category":"공지사항"}' "$BASE/api/notices")
[ "$CODE" = 401 ] && ok "토큰 없이 공지 작성 → 401" || bad "토큰 없이 공지 작성 → $CODE (401이어야 함)"
CODE=$(curl -s -m 15 -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/notices/999999")
[ "$CODE" = 401 ] && ok "토큰 없이 삭제 → 401" || bad "토큰 없이 삭제 → $CODE (401이어야 함)"
CODE=$(curl -s -m 15 -o /dev/null -w "%{http_code}" -X POST -H 'Content-Type: application/json' -d '{}' "$BASE/api/admin/login")
case "$CODE" in
  401) ok "관리자 로그인 API 있음 (빈 값 → 401)";;
  503) bad "관리자 로그인 API → 503 (.env에 ADMIN_ID / ADMIN_PASSWORD 없음)";;
  *)   bad "관리자 로그인 API → $CODE (새 코드가 아직 배포되지 않음?)";;
esac

echo
echo "[4] 보안 헤더"
H=$(curl -sI -m 15 "$BASE/")
echo "$H" | grep -qi '^x-content-type-options: nosniff' && ok "X-Content-Type-Options" || bad "X-Content-Type-Options 없음"
echo "$H" | grep -qi '^x-powered-by' && bad "X-Powered-By 노출" || ok "X-Powered-By 숨김"

echo
echo "결과: OK $PASS / FAIL $FAIL"
[ "$FAIL" -eq 0 ]
