const axios = require('axios');
const db = require('../database');

async function scrapeWorknet() {
    console.log('--- Worknet (K-JOB) Scraping Started ---');
    try {
        // Worknet usually requires an API Key. 
        // We simulate the call here.
        const mockJobs = [
            { title: '제조설계 엔지니어 (시니어)', company: '기아자동차 협력사', region: '경기 화성', salary: '연봉 5,000만원+', source: '워크넷', link: 'https://work.go.kr', deadline: '2026-05-30' },
            { title: '조경 관리 전문가', company: 'LH공사', region: '전남 나주', salary: '월 250만원', source: '워크넷', link: 'https://work.go.kr', deadline: '2026-04-15' }
        ];

        for (const job of mockJobs) {
            await db.execute(
                `INSERT INTO scraped_jobs (title, company, region, salary, link, source, deadline) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE title=VALUES(title)`,
                [job.title, job.company, job.region, job.salary, job.link, job.source, job.deadline]
            );
        }

        console.log(`✅ Worknet: ${mockJobs.length} items saved.`);
        return mockJobs;
    } catch (error) {
        console.error('❌ Worknet Scraping Error:', error.message);
        throw error;
    }
}

module.exports = { scrapeWorknet };
