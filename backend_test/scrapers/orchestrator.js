// backend_test/scrapers/orchestrator.js
const moelScraper = require('./moelScraper');
const seniorroScraper = require('./seniorroScraper');
const worknetScraper = require('./worknetScraper');

async function runAllScrapers() {
    console.log('🚀 [Scraper Orchestrator] 데이터 수집 시작...');
    try {
        const results = await Promise.allSettled([
            moelScraper(),
            seniorroScraper(),
            worknetScraper()
        ]);

        results.forEach((res, i) => {
            const name = i === 0 ? 'MOEL' : i === 1 ? 'Seniorro' : 'Worknet';
            if (res.status === 'fulfilled') {
                console.log(`✅ ${name} 완료: ${res.value}건 수집`);
            } else {
                console.error(`❌ ${name} 실패:`, res.reason.message);
            }
        });

        console.log('🏁 [Scraper Orchestrator] 모든 작업 완료');
    } catch (error) {
        console.error('❌ [Scraper Orchestrator] 예기치 못한 오류:', error.message);
    }
}

if (require.main === module) {
    runAllScrapers().then(() => process.exit(0));
}

module.exports = runAllScrapers;
