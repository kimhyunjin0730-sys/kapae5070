require('dotenv').config();
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
app.use(cors());
app.use(express.json());

// Multer 설정 (메모리 스토리지)
const upload = multer({ storage: multer.memoryStorage() });

// 정적 파일 서빙 (프론트엔드 파일들)
app.use(express.static(__dirname));

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

// --- API 라우터 (MySQL 기반) ---

// 1. 문의하기 API
app.post('/api/inquiry', async (req, res) => {
  try {
    const { type, name, phone, email, text } = req.body;
    // (A) 자체 MySQL에 저장
    const [result] = await db.execute(
      'INSERT INTO inquiries (type, name, phone, email, message) VALUES (?, ?, ?, ?, ?)',
      [type || '일반 문의', name, phone, email || '미입력', text]
    );

    // (B) 메일 서버로 관리자에게 메일 쏘기 (선택적)
    if (transporter) {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.RECEIVER_EMAIL || 'hyunjin@purplenet.kr', // 담당자 (수신 설정 완료)
        replyTo: email || undefined,
        subject: `[KAPAE 문의] ${type || '일반'} - ${name}님`,
        html: `
          <h3>새로운 문의가 접수되었습니다.</h3>
          <p><strong>유형:</strong> ${type || '일반 문의'}</p>
          <p><strong>이름:</strong> ${name}</p>
          <p><strong>연락처:</strong> ${phone}</p>
          <p><strong>이메일:</strong> ${email || '미입력'}</p>
          <p><strong>내용:</strong><br/>${(text || '').replace(/\n/g, '<br/>')}</p>
        `
      };
      // 백그라운드로 전송. await를 걸면 메일 전송이 느릴 경우 브라우저 응답이 길어지므로 뺍니다.
      transporter.sendMail(mailOptions).catch(e => console.error('메일 비동기 전송 에러:', e));
    }

    res.json({ success: true, message: 'DB 저장 완료 및 메일 전송 접수됨.' });
  } catch (error) {
    console.error('Inquiry Error:', error);
    res.status(500).json({ error: '서버 DB 또는 메일 오류입니다.' });
  }
});

// 2. 고용정보 수집 및 매칭 API

// (A) 크롤링 트리거 (관리자용)
app.post('/api/scrape/trigger', async (req, res) => {
  try {
    const results = await runAllScrapers();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// (B) 수집된 공고 목록 가져오기
app.get('/api/scraped-jobs', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM scraped_jobs ORDER BY created_at DESC LIMIT 50');
    res.json({ success: true, jobs: rows });
  } catch (error) {
    console.error('Scraped Jobs Error:', error.message);
    res.status(500).json({ success: false, error: error.message, jobs: [] });
  }
});

// (C) 워크그래피 PDF 업로드 및 파싱
app.post('/api/workgraphy/upload', upload.single('ebook'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '파일이 없습니다.' });
    
    // PDF 파싱
    const parsedData = await parseWorkgraphyPDF(req.file.buffer);
    
    // DB 저장 (샘플 userId: 'guest' 또는 실제 세션 ID)
    const workgraphyId = await saveParsedWorkgraphy('guest', parsedData.text);
    
    res.json({ success: true, workgraphyId, textSnippet: parsedData.text.substring(0, 500) });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// (D) AI 커리어 사주평(진단) 생성/가져오기
app.get('/api/assessment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 기존에 생성된 리포트가 있는지 확인
    const [rows] = await db.execute('SELECT assessment_report FROM workgraphy_parsed WHERE id = ?', [id]);
    if (rows.length > 0 && rows[0].assessment_report) {
      return res.json({ report: rows[0].assessment_report });
    }
    
    // 없으면 생성 (Matching Engine 가동)
    const report = await processUserAssessment(id);
    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. 알림마당 게시판 API (notices)
app.get('/api/notices', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM notice_board WHERE is_active = 1';
    const params = [];

    if (category && category !== '전체') {
      query += ' AND category = ?';
      params.push(category);
    }
    // 프론트엔드 로직에 맞춰 최신 날짜순 정렬
    query += ' ORDER BY published_at DESC, id DESC';

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notices', async (req, res) => {
  try {
    // published_at, is_new, is_hot 등 프론트 배열에서 쓰이는 속성 처리
    const { title, category, content, author, is_new, is_hot, is_active, published_at } = req.body;
    const dateStr = published_at || new Date().toISOString().split('T')[0];

    // MariaDB/MySQL은 boolean이 tinyint(1)로 들어감
    const [result] = await db.execute(
      `INSERT INTO notice_board (title, category, content, author, published_at, is_new, is_hot, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, category, content, author || '운영자', dateStr, is_new ? 1 : 0, is_hot ? 1 : 0, is_active !== false ? 1 : 0]
    );

    // 저장한 로우를 풀스펙으로 가져와 프론트에 반환 (Supabase와 동일한 리턴 형태 [ { } ])
    const [newRow] = await db.execute('SELECT * FROM notice_board WHERE id = ?', [result.insertId]);
    res.json([newRow[0]]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/notices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const updates = [];
    const values = [];

    // 동적 쿼리 생성
    for (const [key, value] of Object.entries(body)) {
      updates.push(`${key} = ?`);
      values.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
    }

    if (updates.length > 0) {
      values.push(id);
      await db.execute(`UPDATE notice_board SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/notices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM notice_board WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. AI 워크그래피 API (기존 Claude 연동 유지)
app.post('/api/workgraphy', async (req, res) => {
  try {
    const { prompt } = req.body;
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
    console.error('AI Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 워크그래피 이력 DB 저장
app.post('/api/workgraphy_requests', async (req, res) => {
  try {
    const { name, phone, email, age_group, status, region, work_type, total_years, skills, summary, careers, ai_result } = req.body;

    await db.execute(
      `INSERT INTO workgraphy_requests 
      (name, phone, email, age_group, status, region, work_type, total_years, skills, summary, careers, ai_result) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, phone, email, age_group, status, region, work_type, total_years,
        JSON.stringify(skills), summary, JSON.stringify(careers), JSON.stringify(ai_result)
      ]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. SPA 라우팅 (Express 5.x 대응)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`KAPAE Server (MySQL Native Engine) running on port ${PORT}!`);
});
