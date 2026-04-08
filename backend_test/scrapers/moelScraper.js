// backend_test/scrapers/moelScraper.js
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../services/db');

async function scrapeMoEL() {
    console.log('--- MOEL 공지사항 크롤링 시작 ---');
    const url = 'https://www.moel.go.kr/news/notice/noticeList.do';
    
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);
        const notices = [];

        $('.common_tablist tbody tr').each((i, el) => {
            const titleEl = $(el).find('td.al a.ellipsis');
            const title = titleEl.text().trim();
            const relativeUrl = titleEl.attr('href');
            const author = $(el).find('td:nth-child(3)').text().trim();
            const date = $(el).find('td:nth-child(5)').text().trim();
            
            if (title && relativeUrl) {
                const detailUrl = 'https://www.moel.go.kr' + relativeUrl;
                // BBS_SEQ 파싱 (고유 ID로 활용)
                const bbsSeqMatch = relativeUrl.match(/bbs_seq=(\d+)/);
                const courseId = bbsSeqMatch ? `moel_${bbsSeqMatch[1]}` : `moel_${Date.now()}_${i}`;

                notices.push({
                    site_source: 'moel',
                    course_id: courseId,
                    title: title,
                    institution: author,
                    edu_period: date, // 공지 날짜를 기간 필드에 임시 저장 (교육 정보로 분류)
                    url: detailUrl
                });
            }
        });

        console.log(`${notices.length}개의 공지사항 발견.`);

        for (const notice of notices) {
            await db.execute(
                `INSERT INTO scraped_education (site_source, course_id, title, institution, edu_period, url) 
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE title = VALUES(title), institution = VALUES(institution), edu_period = VALUES(edu_period), url = VALUES(url)`,
                [notice.site_source, notice.course_id, notice.title, notice.institution, notice.edu_period, notice.url]
            );
        }

        console.log('✅ MOEL 데이터 저장 완료');
        return notices.length;
    } catch (error) {
        console.error('❌ MOEL 크롤링 중 오류 발생:', error.message);
        throw error;
    }
}

// 직접 실행 테스트용
if (require.main === module) {
    scrapeMoEL().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = scrapeMoEL;
