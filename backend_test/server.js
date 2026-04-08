// backend_test/server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const runAllScrapers = require('./scrapers/orchestrator');
const { parseWorkgraphyEbook } = require('./services/workgraphyService');
const { generateAssessment } = require('./services/matchingEngine');
const db = require('./services/db');

const app = express();
const PORT = 3001; // 메인 서버와 겹치지 않게 3001 사용

app.use(express.json());

// Multer 설정 (PDF 업로드용)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `workgraphy_${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ storage });

// 1. 고용정보 수집 (Scraping) 트리거
app.post('/api/scrape', async (req, res) => {
    try {
        await runAllScrapers();
        res.json({ success: true, message: '고용정보 수집 작업이 완료되었습니다.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. 워크그래피(e-book) 업로드 및 파싱
app.post('/api/upload-workgraphy', upload.single('ebook'), async (req, res) => {
    try {
        if (!req.file) throw new Error('업로드된 파일이 없습니다.');
        const userName = req.body.userName || 'Unknown User';
        
        const result = await parseWorkgraphyEbook(req.file.path, userName);
        res.json({ success: true, profileId: result.id, message: '파일 업로드 및 파싱 완료' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. 매칭 및 종합 사주평(Assessment) 리포트 조회
app.get('/api/assessment/:id', async (req, res) => {
    try {
        const profileId = req.params.id;
        const report = await generateAssessment(profileId);
        res.json({ success: true, report: report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 수집된 데이터 조회 인터페이스 (테스트용)
app.get('/api/data-summary', async (req, res) => {
    try {
        const [jobsCount] = await db.execute('SELECT COUNT(*) as count FROM scraped_jobs');
        const [eduCount] = await db.execute('SELECT COUNT(*) as count FROM scraped_education');
        const [profilesCount] = await db.execute('SELECT COUNT(*) as count FROM workgraphy_parsed');
        
        res.json({ 
            jobs: jobsCount[0].count, 
            education: eduCount[0].count,
            profiles: profilesCount[0].count
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 [Backend Test Server] Running at http://localhost:${PORT}`);
    console.log('--- 1. POST /api/scrape : 수집 시작');
    console.log('--- 2. POST /api/upload-workgraphy : e-book 업로드 (ebook 필드)');
    console.log('--- 3. GET /api/assessment/:id : 사주평 및 매칭 결과 생성/조회');
});
