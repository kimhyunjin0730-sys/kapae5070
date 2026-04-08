const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../database');

async function scrapeMoel() {
    console.log('--- MOEL Scraping Started ---');
    try {
        const url = 'https://www.moel.go.kr/news/notice/noticeList.do';
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        const jobs = [];
        $('.table_unfixed tbody tr').each((i, el) => {
            if (i >= 5) return; // 상위 5개만 샘플링
            const title = $(el).find('td.left a').text().trim();
            const date = $(el).find('td').eq(4).text().trim();
            const link = 'https://www.moel.go.kr' + $(el).find('td.left a').attr('href');
            
            if (title) {
                jobs.push({
                    title,
                    company: '고용노동부',
                    region: '전국',
                    salary: '공고참조',
                    link,
                    source: 'MOEL',
                    deadline: date
                });
            }
        });

        for (const job of jobs) {
            await db.execute(
                `INSERT INTO scraped_jobs (title, company, region, salary, link, source, deadline) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE title=VALUES(title)`,
                [job.title, job.company, job.region, job.salary, job.link, job.source, job.deadline]
            );
        }
        
        console.log(`✅ MOEL: ${jobs.length} items saved.`);
        return jobs;
    } catch (error) {
        console.error('❌ MOEL Scraping Error:', error.message);
        throw error;
    }
}

module.exports = { scrapeMoel };
