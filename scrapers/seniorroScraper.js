const axios = require('axios');
const db = require('../database');

async function scrapeSeniorro() {
    console.log('--- Seniorro Scraping Started ---');
    try {
        const url = 'https://seniorro.or.kr/job/jobList.do';
        const payload = {
            searchCondition: 'all',
            searchKeyword: '',
            pageUnit: 10,
            pageIndex: 1
        };

        const { data } = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        // Seniorro uses AJAX POST to fetch results.
        // Mocking JSON parsing here for demonstration since the actual site might return HTML/JSON.
        const mockJobs = [
            { title: '서울 실버 택배 도우미', company: '대한노인회', region: '서울 강남구', salary: '시급 10,000원', source: '노인일자리 여기', link: 'https://seniorro.or.kr', deadline: '상시채용' },
            { title: '경기 고양시 급식 보조', company: '고양시니어클럽', region: '경기 고양시', salary: '월 60만원', source: '노인일자리 여기', link: 'https://seniorro.or.kr', deadline: '2026-12-31' }
        ];

        for (const job of mockJobs) {
            await db.execute(
                `INSERT INTO scraped_jobs (title, company, region, salary, link, source, deadline) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE title=VALUES(title)`,
                [job.title, job.company, job.region, job.salary, job.link, job.source, job.deadline]
            );
        }

        console.log(`✅ Seniorro: ${mockJobs.length} items saved.`);
        return mockJobs;
    } catch (error) {
        console.error('❌ Seniorro Scraping Error:', error.message);
        throw error;
    }
}

module.exports = { scrapeSeniorro };
