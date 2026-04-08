// backend_test/scrapers/seniorroScraper.js
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../services/db');
const qs = require('qs');

async function scrapeSeniorro() {
    console.log('--- Seniorro (노인일자리 여기) 크롤링 시작 ---');
    const url = 'https://www.seniorro.or.kr/noin/searchJobList.do';
    
    try {
        // AJAX POST 요청 에뮬레이션
        const payload = qs.stringify({
            sst01: '', // 시도 코드 (전체)
            sst02: '', // 시군구 코드 (전체)
            sst03: '', 
            sst04: '',
            jobNm: '',
            pageIndex: 1
        });

        const { data } = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        // 데이터가 JSON으로 올 수도 있고 HTML 조각으로 올 수도 있음 (사이트 구조상 HTML 조각인 경우가 많음)
        const $ = cheerio.load(data);
        const jobs = [];

        // 분석된 셀렉터: #rsList02 li
        $('li').each((i, el) => {
            const title = $(el).find('.info-tit strong').text().trim();
            const region = $(el).find('.info-stit span:last-child').text().trim();
            const deadline = $(el).find('.info-date').text().trim();
            
            // 상세 링크가 복잡할 수 있으니 일단 제목과 지역 기반으로 데이터화
            if (title) {
                const jobId = `seniorro_${Date.now()}_${i}`;
                jobs.push({
                    site_source: 'seniorro',
                    job_id: jobId,
                    title: title,
                    company: '관련 기관', // 상세 데이터에서 추출 필요
                    region: region,
                    deadline: deadline,
                    url: 'https://www.seniorro.or.kr/seniorro/job/jobList.do'
                });
            }
        });

        console.log(`${jobs.length}개의 노인 일자리 발견.`);

        for (const job of jobs) {
            await db.execute(
                `INSERT INTO scraped_jobs (site_source, job_id, title, company, region, deadline, url) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE title = VALUES(title), region = VALUES(region), deadline = VALUES(deadline)`,
                [job.site_source, job.job_id, job.title, job.company, job.region, job.deadline, job.url]
            );
        }

        console.log('✅ Seniorro 데이터 저장 완료');
        return jobs.length;
    } catch (error) {
        console.error('❌ Seniorro 크롤링 중 오류 발생:', error.message);
        throw error;
    }
}

if (require.main === module) {
    scrapeSeniorro().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = scrapeSeniorro;
