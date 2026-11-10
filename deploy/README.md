# kapae5070.org 서버 복구 런북

## 현재 상태 (2026-11-10 외부 점검 기준)

| 항목 | 내용 |
|---|---|
| 서버 | GCP VM `34.82.14.164`, nginx 1.22.1 |
| 배포 방식 | 서버의 저장소에서 `git fetch` → `git reset --hard origin/main` (서버 `.git` 기록으로 확인) |
| 마지막 배포 | 2026-04-08 `fd38e9d` |
| 문제 1 | nginx가 저장소 폴더를 웹 루트로 공개 → `/.env`, `/.git/`, `database.js` 등이 누구나 다운로드 가능 |
| 문제 2 | `/api/*` 전부 502 → Node 서버가 꺼져 있음 (문의 폼·공지·워크그래피 저장 불가) |

순서가 중요합니다. **노출부터 막고(2단계) → 키를 바꾸고(4단계) → 새 코드를 올립니다.**
키를 먼저 바꾸면 새 키도 그대로 노출됩니다.

---

## 0. 시작 전 (로컬)

- 보안 수정 커밋이 GitHub `main`에 푸시돼 있어야 합니다. 서버는 GitHub에서 코드를 받아갑니다.
- 점검 스크립트는 어디서든 돌릴 수 있습니다: `bash deploy/verify-live.sh`

## 1. 접속하고 현재 상태 보기 (읽기만)

외부에서 22번 포트가 막혀 있으므로 GCP 콘솔의 **SSH** 버튼이나 `gcloud compute ssh`로 들어갑니다.

```bash
# 사이트 설정 파일, 웹 루트(=배포 폴더), 기존 프록시 포트 찾기
sudo nginx -T 2>/dev/null | grep -nE "server_name|root |proxy_pass|listen|# configuration file"

# Node가 어떻게 돌고 있었는지 (pm2 / systemd / 수동)
systemctl list-units --type=service --all | grep -iE "kapae|node"
pm2 ls 2>/dev/null
ps aux | grep -E "node .*server\.js" | grep -v grep

# Node 버전 (18 이상 필요)
node -v

# DB 상태와 테이블
systemctl status mariadb mysql --no-pager 2>/dev/null | grep -E "●|Active:"
sudo mysql -e "SHOW DATABASES; USE kapae5070; SHOW TABLES;"
```

여기서 확인한 **배포 폴더**를 아래에서 `$DEPLOY_DIR`로 씁니다.

```bash
DEPLOY_DIR=/여기에/배포/폴더    # nginx root 경로
```

## 2. 긴급 차단 (5분, 코드 배포 전에)

```bash
sudo cp -a /etc/nginx /etc/nginx.bak.$(date +%Y%m%d-%H%M%S)
sudo nano /etc/nginx/sites-available/<사이트 파일>   # 443 server 블록 안에 nginx-kapae5070.conf의 [A] 붙여넣기
sudo nginx -t && sudo systemctl reload nginx
```

로컬에서 `bash deploy/verify-live.sh`를 돌려 **[2] 서버 파일 비노출** 항목이 전부 OK인지 확인합니다.
(이 시점엔 [1]·[3]이 아직 실패하는 게 정상입니다.)

## 3. 백업

```bash
sudo cp -a "$DEPLOY_DIR" "$DEPLOY_DIR.bak.$(date +%Y%m%d-%H%M%S)"
sudo mysqldump --single-transaction kapae5070 > ~/kapae5070-db-$(date +%Y%m%d-%H%M%S).sql
chmod 600 ~/kapae5070-db-*.sql
```

백업 폴더에는 옛 `.env`가 들어 있으니 웹 루트 밖에 두고 권한을 유지하세요.

## 4. 노출된 키 전부 교체

옛 값은 노출된 `.env`와 공개 GitHub 이력에 남아 있으므로 **폐기 후 새로 발급**합니다.

| 항목 | 어디서 | `.env` 키 |
|---|---|---|
| Anthropic API 키 | console.anthropic.com → API Keys (옛 키 삭제) | `ANTHROPIC_API_KEY` |
| Gemini API 키 | aistudio.google.com → API keys (옛 키 삭제) | `GEMINI_API_KEY` |
| Gmail 앱 비밀번호 | myaccount.google.com/apppasswords (옛 것 삭제) | `SMTP_PASS` |
| DB 앱 계정 비밀번호 | 아래 SQL | `DB_USER`, `DB_PASS` |
| 관리자 계정 | 새로 정하기 (예전에 코드에 박혀 있던 계정·비번은 쓰지 말 것) | `ADMIN_ID`, `ADMIN_PASSWORD` |
| 관리자 토큰 서명키 | `openssl rand -hex 32` | `ADMIN_TOKEN_SECRET` |

DB는 root 대신 앱 전용 계정을 씁니다 (테이블 생성은 5단계에서 `sudo mysql`로).

```bash
sudo mysql <<'SQL'
CREATE USER IF NOT EXISTS 'kapae'@'localhost' IDENTIFIED BY '새-DB-비밀번호';
ALTER USER 'kapae'@'localhost' IDENTIFIED BY '새-DB-비밀번호';
GRANT SELECT, INSERT, UPDATE, DELETE ON kapae5070.* TO 'kapae'@'localhost';
FLUSH PRIVILEGES;
SQL
```

root에 비밀번호를 걸어 썼다면 그것도 바꿉니다. 3306 포트는 외부에서 막혀 있지만, 옛 비밀번호가 공개 저장소에 있습니다.

```bash
sudo mysql -e "SET PASSWORD FOR 'root'@'localhost' = PASSWORD('새-root-비밀번호');"
```

## 5. 코드·설정·DB 반영

```bash
cd "$DEPLOY_DIR"
git status --short                    # 서버에서 직접 고친 파일이 있으면 멈추고 3단계 백업 확인
git fetch origin
git log --oneline HEAD..origin/main   # 받을 커밋 확인
git reset --hard origin/main          # 기존 배포 방식과 같음 (.env, node_modules는 git 밖이라 유지됨)
npm ci --omit=dev
```

`.env`를 고칩니다. 항목은 `.env.example`을 참고하세요.

```bash
cp .env ".env.bak.$(date +%Y%m%d-%H%M%S)"
nano .env          # 4단계의 새 값 + PORT=3000, HOST=127.0.0.1, DB_USER=kapae
chmod 600 .env .env.bak.*
```

DB 스키마를 맞춥니다. 모든 테이블이 `IF NOT EXISTS`라서 기존 데이터는 건드리지 않습니다.

```bash
sudo mysql < init.sql
sudo mysql kapae5070 -e "SHOW TABLES; DESCRIBE scraped_jobs; DESCRIBE workgraphy_parsed;"
```

`scraped_jobs`나 `workgraphy_parsed`가 예전 컬럼(`site_source`, `url`, `parsed_text` 등)으로 이미 있으면
코드와 맞지 않습니다. 지우지 말고 이름을 바꾼 뒤 `init.sql`을 다시 돌립니다.

```bash
sudo mysql kapae5070 -e "RENAME TABLE scraped_jobs TO scraped_jobs_old_20261110;"   # 필요한 표만
sudo mysql < init.sql
```

공지 본문이 64KB를 넘을 수 있게 하려면 (선택):

```bash
sudo mysql kapae5070 -e "ALTER TABLE notice_board MODIFY content MEDIUMTEXT;"
```

## 6. Node 서버를 서비스로 등록

pm2 등으로 돌리던 게 있으면 **kapae 프로세스만** 멈춥니다. 둘 다 켜지면 포트가 충돌합니다.
같은 VM에 다른 앱이 있을 수 있으니 `pm2 stop all`은 쓰지 마세요.

```bash
pm2 ls                                # kapae의 server.js를 돌리는 프로세스 이름 확인
pm2 stop <그 이름> && pm2 save        # pm2를 안 쓰면 건너뜀
```

`deploy/kapae5070.service` 맨 위 주석의 설치 명령을 `$DEPLOY_DIR`에서 실행합니다.

```bash
cd "$DEPLOY_DIR"
sed -e "s#__DEPLOY_USER__#$(whoami)#" \
    -e "s#__DEPLOY_DIR__#$(pwd)#" \
    -e "s#__NODE_BIN__#$(command -v node)#" \
    deploy/kapae5070.service | sudo tee /etc/systemd/system/kapae5070.service
sudo systemctl daemon-reload
sudo systemctl enable --now kapae5070
systemctl status kapae5070 --no-pager
curl -s http://127.0.0.1:3000/api/health     # {"ok":true,"db":"up"} 이어야 함
```

실패하면 `journalctl -u kapae5070 -n 50 --no-pager`로 원인을 봅니다.

| 로그 | 원인 |
|---|---|
| `EADDRINUSE` | 포트를 다른 프로세스가 쓰는 중 (pm2 등) |
| `Access denied for user` | `.env`의 `DB_USER` / `DB_PASS`와 4단계 SQL 불일치 |
| `ER_NO_SUCH_TABLE` | 5단계 `init.sql` 미실행 |
| `ADMIN_ID / ADMIN_PASSWORD가 .env에 없어` | 관리자 계정 미설정 (서버는 뜨지만 관리자 로그인 불가) |

## 7. nginx를 최종 형태로 전환

`deploy/nginx-kapae5070.conf`의 **[B]**로 기존 `root` / `try_files` / `location` 블록을 교체합니다.
[A]는 남겨둬도 됩니다. `proxy_pass` 포트는 `.env`의 `PORT`와 맞춥니다.

```bash
sudo cp -a /etc/nginx /etc/nginx.bak.$(date +%Y%m%d-%H%M%S)
sudo nano /etc/nginx/sites-available/<사이트 파일>
sudo nginx -t && sudo systemctl reload nginx
```

## 8. 점검

```bash
bash deploy/verify-live.sh      # 전부 OK여야 함
```

브라우저로도 직접 확인합니다.
- 메인에서 `Ctrl+Shift+A` → 새 관리자 계정으로 로그인 → 공지 목록이 보이는지
- 알림마당 `🔐 관리자` 로그인 → 글 작성·수정·삭제
- 문의 폼 제출 → `RECEIVER_EMAIL`로 메일이 오는지

## 9. 모니터링

UptimeRobot 같은 무료 모니터에 `https://kapae5070.org/api/health`를 5분 간격으로 걸어둡니다.
DB까지 확인하므로 `/api/notices`보다 정확합니다.

---

## 되돌리기

```bash
sudo systemctl stop kapae5070
# nginx: 2·7단계에서 만든 /etc/nginx.bak.<시각> 에서 사이트 파일만 다시 복사 → nginx -t → reload
# 코드: cd "$DEPLOY_DIR" && git reset --hard fd38e9d   (옛 코드는 보안 구멍이 그대로이니 [A] 차단은 유지)
```

## 복구 후에도 남는 문제

- **AI 워크그래피·매칭**: 쓰던 모델(`claude-3-5-sonnet-20240620`, `gemini-1.5-flash`)이 서비스 종료돼서 화면엔 기본(폴백) 결과만 나옵니다.
- **관리자 문의 목록**: 관리자 패널이 부르는 `GET /api/inquiries`가 아직 없습니다. 문의는 DB(`inquiries` 표)와 메일로만 확인됩니다.
- **git 이력의 옛 비밀번호**: 4단계 교체로 무력화됩니다. 이력에서 지우려면 별도 작업(force push)이 필요합니다.
