// backend_test/scrapers/worknetScraper.js
const db = require('../services/db');

/**
 * 워크넷(고용24) 크롤링 프로토타입
 * 실제 운영 시에는 워크넷 Open API(http://openapi.work.go.kr) 사용을 강력 권장합니다.
 * 본 스크립트는 검색 결과 페이지의 구조를 기반으로 한 목업/프로토타입 데이터 생성 로직입니다.
 */
async function scrapeWorknet() {
    console.log('--- Worknet (Goyong24) 크롤링 시작 (프로토타입) ---');
    
    try {
        // 실제 API 연동 전까지 테스트를 위한 가상 데이터 생성
        const mockJobs = [
            {
                site_source: 'worknet',
                job_id: 'work_mock_001',
                title: '[중장년] 재취업 지원 서비스 상담사 채용',
                company: '(주)미래경력지원센터',
                region: '서울시 강남구',
                salary: '월급 250만원 이상',
                deadline: '2026-05-15',
                url: 'https://www.work.go.kr/empInfo/empInfoSrch/list/dtlEmpSrchList.do'
            },
            {
                site_source: 'worknet',
                job_id: 'work_mock_002',
                title: '시니어 디지털 튜터 강사 모집',
                company: '한국중장년고용협회',
                region: '서울시 서초구',
                salary: '시급 15,000원',
                deadline: '상시채용',
                url: 'https://www.work.go.kr/empInfo/empInfoSrch/list/dtlEmpSrchList.do'
            }
        ];

        for (const job of mockJobs) {
            await db.execute(
                `INSERT INTO scraped_jobs (site_source, job_id, title, company, region, salary, deadline, url) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE title = VALUES(title), company = VALUES(company), region = VALUES(region)`,
                [job.site_source, job.job_id, job.title, job.company, job.region, job.salary, job.deadline, job.url]
            );
        }

        console.log(`✅ Worknet 프로토타입 데이터 ${mockJobs.length}건 저장 완료`);
        return mockJobs.length;
    } catch (error) {
        console.error('❌ Worknet 크롤링 중 오류 발생:', error.message);
        throw error;
    }
}

if (require.main === module) {
    scrapeWorknet().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = scrapeWorknet;
