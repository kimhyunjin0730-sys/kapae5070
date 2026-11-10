require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const db = require('./database'); // mysql2/promise pool

const multer = require('multer');
const { runAllScrapers } = require('./scrapers/orchestrator');
const { parseWorkgraphyPDF, saveParsedWorkgraphy } = require('./services/workgraphyService');
const { processUserAssessment } = require('./services/matchingEngine');

const app = express();
app.disable('x-powered-by');
// nginx 리버스 프록시 뒤에서 실제 클라이언트 IP(req.ip)를 쓰기 위함
app.set('trust proxy', 'loopback');

// --- 🔒 공통 보안 헤더 ---
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// --- 🔒 CORS: 허용한 출처만 (같은 출처 요청은 CORS와 무관하게 동작) ---
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://kapae5070.org,https://www.kapae5070.org')
  .split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: (origin, cb) => cb(null, !origin || ALLOWED_ORIGINS.includes(origin)) }));
app.use(express.json());

// --- 🔒 정적 파일: 공개해도 되는 파일만 화이트리스트로 서빙 ---
// (예전처럼 express.static(__dirname)을 쓰면 .env, database.js 등 서버 파일까지 노출됨)
const PUBLIC_PAGES = [
  'index.html', 'about.html', 'organization.html', 'history.html',
  'business.html', 'business-detail.html', 'purplenet.html',
  'notice.html', 'notice-view.html', 'contact.html', 'contact-done.html',
  'sitemap.html', 'policy.html', 'admin.html',
];
for (const file of PUBLIC_PAGES) {
  app.get(`/${file}`, (req, res) => res.sendFile(path.join(__dirname, file)));
}
// 디자인 자원(CSS·JS·이미지)은 assets 폴더 안의 것만 공개
app.use('/assets', express.static(path.join(__dirname, 'assets'), { index: false, dotfiles: 'ignore', maxAge: '1h' }));
app.use('/assets', (req, res) => res.status(404).end());

// --- 🔒 공통 유틸 ---
function rateLimit({ windowMs, max, message }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    let entry = hits.get(req.ip);
    if (!entry || now > entry.reset) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(req.ip, entry);
    }
    entry.count += 1;
    if (hits.size > 10000) {
      for (const [key, value] of hits) if (now > value.reset) hits.delete(key);
    }
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ error: message || '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' });
    }
    next();
  };
}

const MIN = 60 * 1000;
const loginLimiter = rateLimit({ windowMs: 15 * MIN, max: 10, message: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.' });
const inquiryLimiter = rateLimit({ windowMs: 60 * MIN, max: 10 });
const aiLimiter = rateLimit({ windowMs: 60 * MIN, max: 20 });
const uploadLimiter = rateLimit({ windowMs: 60 * MIN, max: 10 });

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function oneLine(value, maxLen) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, maxLen);
}

// 선택 입력값: 비어 있으면 NULL로 저장
function optionalLine(value, maxLen) {
  return oneLine(value, maxLen) || null;
}

// 서버 내부 오류는 로그로만 남기고, 클라이언트에는 DB/스택 정보를 내보내지 않음
function serverError(res, label, error) {
  console.error(`${label}:`, error);
  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
}

function isPositiveInt(value) {
  return /^\d{1,10}$/.test(String(value));
}

// --- 🔐 관리자 인증 (서버 발급 토큰) ---
const ADMIN_ID = process.env.ADMIN_ID;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
// 미설정 시 서버를 재시작할 때마다 기존 로그인이 풀림
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || crypto.randomBytes(32).toString('hex');
const ADMIN_TOKEN_TTL_MS = 8 * 60 * MIN;

if (!ADMIN_ID || !ADMIN_PASSWORD) {
  console.warn('⚠️  ADMIN_ID / ADMIN_PASSWORD가 .env에 없어 관리자 로그인이 비활성화됩니다.');
}
if (!process.env.ADMIN_TOKEN_SECRET) {
  console.warn('⚠️  ADMIN_TOKEN_SECRET이 .env에 없어 임시 값을 사용합니다 (재시작 시 관리자 재로그인 필요).');
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function signAdminToken() {
  const payload = Buffer.from(JSON.stringify({ sub: 'admin', exp: Date.now() + ADMIN_TOKEN_TTL_MS })).toString('base64url');
  const sig = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function isValidAdminToken(token) {
  if (typeof token !== 'string') return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(payload).digest('base64url');
  if (!safeEqual(sig, expected)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
}

function hasAdminToken(req) {
  const match = /^Bearer (.+)$/.exec(req.get('authorization') || '');
  return Boolean(match && isValidAdminToken(match[1]));
}

function requireAdmin(req, res, next) {
  if (hasAdminToken(req)) return next();
  res.status(401).json({ error: '관리자 로그인이 필요합니다.' });
}

app.post('/api/admin/login', loginLimiter, (req, res) => {
  if (!ADMIN_ID || !ADMIN_PASSWORD) {
    return res.status(503).json({ error: '서버에 관리자 계정이 설정되지 않았습니다.' });
  }
  const { id, password } = req.body || {};
  // 둘 다 항상 비교해서 응답 시간 차이로 아이디 존재 여부가 드러나지 않게 함
  const idOk = safeEqual(id ?? '', ADMIN_ID);
  const pwOk = safeEqual(password ?? '', ADMIN_PASSWORD);
  if (!(idOk && pwOk)) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  }
  res.json({ token: signAdminToken(), expiresIn: ADMIN_TOKEN_TTL_MS / 1000 });
});

// --- 📧 이메일 전송 세팅 (Nodemailer + Google SMTP) ---
let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// replyTo 헤더에 넣으므로 쉼표·세미콜론·괄호 같은 주소 구분 문자는 허용하지 않음
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// --- API 라우터 (MySQL 기반) ---

// 1. 문의하기 API
app.post('/api/inquiry', inquiryLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const type = oneLine(body.type, 50) || '일반 문의';
    const name = oneLine(body.name, 50);
    const phone = oneLine(body.phone, 50);
    const email = oneLine(body.email, 100);
    const text = String(body.text ?? '').slice(0, 5000);

    if (!name || !text.trim()) {
      return res.status(400).json({ error: '이름과 문의 내용을 입력해주세요.' });
    }
    // 회신 주소(replyTo)로는 형식이 맞는 이메일만 사용
    const validEmail = EMAIL_RE.test(email) ? email : '';

    // (A) 자체 MySQL에 저장
    await db.execute(
      'INSERT INTO inquiries (type, name, phone, email, message) VALUES (?, ?, ?, ?, ?)',
      [type, name, phone, email || '미입력', text]
    );

    // (B) 메일 서버로 관리자에게 메일 쏘기 (선택적)
    if (transporter) {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.RECEIVER_EMAIL || 'hyunjin@purplenet.kr', // 담당자 (수신 설정 완료)
        replyTo: validEmail || undefined,
        subject: `[KAPAE 문의] ${type} - ${name}님`,
        // 사용자 입력은 전부 이스케이프해서 메일 본문에 HTML/스크립트가 주입되지 않게 함
        html: `
          <h3>새로운 문의가 접수되었습니다.</h3>
          <p><strong>유형:</strong> ${escapeHtml(type)}</p>
          <p><strong>이름:</strong> ${escapeHtml(name)}</p>
          <p><strong>연락처:</strong> ${escapeHtml(phone)}</p>
          <p><strong>이메일:</strong> ${escapeHtml(email || '미입력')}</p>
          <p><strong>내용:</strong><br/>${escapeHtml(text).replace(/\n/g, '<br/>')}</p>
        `
      };
      // 백그라운드로 전송. await를 걸면 메일 전송이 느릴 경우 브라우저 응답이 길어지므로 뺍니다.
      transporter.sendMail(mailOptions).catch(e => console.error('메일 비동기 전송 에러:', e));
    }

    res.json({ success: true, message: 'DB 저장 완료 및 메일 전송 접수됨.' });
  } catch (error) {
    serverError(res, 'Inquiry Error', error);
  }
});

// 2. 고용정보 수집 및 매칭 API

// (A) 크롤링 트리거 (관리자용)
app.post('/api/scrape/trigger', requireAdmin, async (req, res) => {
  try {
    const results = await runAllScrapers();
    res.json({ success: true, results });
  } catch (error) {
    serverError(res, 'Scrape Trigger Error', error);
  }
});

// (B) 수집된 공고 목록 가져오기
app.get('/api/scraped-jobs', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM scraped_jobs ORDER BY created_at DESC LIMIT 50');
    res.json({ success: true, jobs: rows });
  } catch (error) {
    console.error('Scraped Jobs Error:', error.message);
    res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.', jobs: [] });
  }
});

// (C) 워크그래피 PDF 업로드 및 파싱
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('PDF_ONLY'));
  },
});

function uploadSinglePdf(req, res, next) {
  upload.single('ebook')(req, res, err => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? '파일은 10MB 이하만 올릴 수 있습니다.'
      : err.message === 'PDF_ONLY' ? 'PDF 파일만 올릴 수 있습니다.' : '파일 업로드에 실패했습니다.';
    res.status(400).json({ error: message });
  });
}

app.post('/api/workgraphy/upload', uploadLimiter, uploadSinglePdf, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '파일이 없습니다.' });

    // PDF 파싱
    const parsedData = await parseWorkgraphyPDF(req.file.buffer);

    // DB 저장 (샘플 userId: 'guest' 또는 실제 세션 ID)
    const workgraphyId = await saveParsedWorkgraphy('guest', parsedData.text);

    res.json({ success: true, workgraphyId, textSnippet: parsedData.text.substring(0, 500) });
  } catch (error) {
    serverError(res, 'Upload Error', error);
  }
});

// (D) AI 커리어 사주평(진단) 생성/가져오기
app.get('/api/assessment/:id', aiLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isPositiveInt(id)) return res.status(400).json({ error: '잘못된 요청입니다.' });

    // 기존에 생성된 리포트가 있는지 확인
    const [rows] = await db.execute('SELECT assessment_report FROM workgraphy_parsed WHERE id = ?', [id]);
    if (rows.length > 0 && rows[0].assessment_report) {
      return res.json({ report: rows[0].assessment_report });
    }

    // 없으면 생성 (Matching Engine 가동)
    const report = await processUserAssessment(id);
    res.json({ report });
  } catch (error) {
    serverError(res, 'Assessment Error', error);
  }
});

// 3. 알림마당 게시판 API (notices)
const NOTICE_TEXT_LIMITS = { title: 255, category: 50, author: 50, content: 200000 };
const NOTICE_BOOL_FIELDS = ['is_new', 'is_hot', 'is_active'];

function toDateOnly(value) {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value ?? ''));
  return match ? match[1] : new Date().toISOString().split('T')[0];
}

// 요청 body에서 허용된 컬럼만 골라냄 (컬럼명이 SQL에 그대로 들어가므로 화이트리스트 필수)
function pickNoticeFields(body) {
  const fields = {};
  for (const [key, limit] of Object.entries(NOTICE_TEXT_LIMITS)) {
    if (body[key] !== undefined) fields[key] = String(body[key] ?? '').slice(0, limit);
  }
  for (const key of NOTICE_BOOL_FIELDS) {
    if (body[key] !== undefined) fields[key] = body[key] ? 1 : 0;
  }
  if (body.published_at !== undefined) fields.published_at = toDateOnly(body.published_at);
  return fields;
}

app.get('/api/notices', async (req, res) => {
  try {
    const { category, all } = req.query;
    // ?all=1 은 관리자 전용(비활성 글 포함): 토큰이 없거나 만료되면 401로 알려 관리자 화면이 다시 로그인하게 함
    if (all === '1' && !hasAdminToken(req)) {
      return res.status(401).json({ error: '관리자 로그인이 필요합니다.' });
    }
    const includeInactive = all === '1';
    let query = includeInactive ? 'SELECT * FROM notice_board WHERE 1 = 1' : 'SELECT * FROM notice_board WHERE is_active = 1';
    const params = [];

    if (category && category !== '전체') {
      query += ' AND category = ?';
      params.push(String(category));
    }
    // 프론트엔드 로직에 맞춰 최신 날짜순 정렬
    query += ' ORDER BY published_at DESC, id DESC';

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    serverError(res, 'Notices Error', error);
  }
});

app.post('/api/notices', requireAdmin, async (req, res) => {
  try {
    const fields = pickNoticeFields(req.body || {});
    if (!fields.title || !fields.category) {
      return res.status(400).json({ error: '제목과 분류는 필수입니다.' });
    }

    // MariaDB/MySQL은 boolean이 tinyint(1)로 들어감
    const [result] = await db.execute(
      `INSERT INTO notice_board (title, category, content, author, published_at, is_new, is_hot, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fields.title,
        fields.category,
        fields.content ?? '',
        fields.author || '운영자',
        fields.published_at || toDateOnly(),
        fields.is_new ?? 0,
        fields.is_hot ?? 0,
        fields.is_active ?? 1,
      ]
    );

    // 저장한 로우를 풀스펙으로 가져와 프론트에 반환 (Supabase와 동일한 리턴 형태 [ { } ])
    const [newRow] = await db.execute('SELECT * FROM notice_board WHERE id = ?', [result.insertId]);
    res.json([newRow[0]]);
  } catch (error) {
    serverError(res, 'Notice Create Error', error);
  }
});

app.patch('/api/notices/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isPositiveInt(id)) return res.status(400).json({ error: '잘못된 게시글 ID입니다.' });

    const fields = pickNoticeFields(req.body || {});
    const keys = Object.keys(fields);
    if (keys.length === 0) return res.status(400).json({ error: '수정할 항목이 없습니다.' });

    const updates = keys.map(key => `${key} = ?`);
    const values = [...keys.map(key => fields[key]), id];
    await db.execute(`UPDATE notice_board SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ success: true });
  } catch (error) {
    serverError(res, 'Notice Update Error', error);
  }
});

app.delete('/api/notices/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isPositiveInt(id)) return res.status(400).json({ error: '잘못된 게시글 ID입니다.' });
    await db.execute('DELETE FROM notice_board WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    serverError(res, 'Notice Delete Error', error);
  }
});

// 4. AI 워크그래피 API (기존 Claude 연동 유지)
// TODO: 프롬프트를 서버에서 조립하도록 바꾸면 임의 프롬프트 중계를 완전히 막을 수 있음
const MAX_PROMPT_CHARS = 12000;
app.post('/api/workgraphy', aiLimiter, async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > MAX_PROMPT_CHARS) {
      return res.status(400).json({ error: '잘못된 요청입니다.' });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'AI 서비스가 설정되지 않았습니다.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1500,
        system: '당신은 중장년 고용 전문가입니다. 워크그래피 생성 요청에 반드시 순수 JSON만 반환하세요.',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) throw new Error(`Anthropic API Error: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    serverError(res, 'AI Error', error);
  }
});

// 워크그래피 이력 DB 저장
app.post('/api/workgraphy_requests', inquiryLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const name = oneLine(body.name, 50);
    if (!name) return res.status(400).json({ error: '이름을 입력해주세요.' });

    await db.execute(
      `INSERT INTO workgraphy_requests
      (name, phone, email, age_group, status, region, work_type, total_years, skills, summary, careers, ai_result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        optionalLine(body.phone, 50),
        optionalLine(body.email, 100),
        optionalLine(body.age_group, 20),
        optionalLine(body.status, 50),
        optionalLine(body.region, 100),
        optionalLine(body.work_type, 50),
        optionalLine(body.total_years, 20),
        JSON.stringify(body.skills ?? null),
        String(body.summary ?? '').slice(0, 5000),
        JSON.stringify(body.careers ?? null),
        JSON.stringify(body.ai_result ?? null),
      ]
    );
    res.json({ success: true });
  } catch (error) {
    serverError(res, 'Workgraphy Request Error', error);
  }
});

// 헬스체크 (업타임 모니터링·배포 확인용) — DB 연결과 핵심 테이블까지 확인
app.get('/api/health', async (req, res) => {
  try {
    await db.execute('SELECT 1 FROM notice_board LIMIT 1');
    res.json({ ok: true, db: 'up' });
  } catch (error) {
    console.error('Health DB Error:', error.message);
    res.status(503).json({ ok: false, db: 'down' });
  }
});

// 정의되지 않은 /api 경로는 index.html 대신 JSON 404
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// 5. SPA 라우팅 (Express 5.x 대응)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// nginx가 80/443을 받고 이 서버로 넘겨주므로, 기본값은 내부 전용 주소·포트
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
  console.log(`KAPAE Server (MySQL Native Engine) running on http://${HOST}:${PORT}`);
});
