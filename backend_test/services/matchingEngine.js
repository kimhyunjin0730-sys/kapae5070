// backend_test/services/matchingEngine.js
const db = require('./db');
const { generateSajuPyeongReport } = require('./geminiService');

async function generateAssessment(profileId) {
    try {
        // 1. 사용자 프로필 가져오기
        const [profiles] = await db.execute('SELECT * FROM workgraphy_parsed WHERE id = ?', [profileId]);
        if (profiles.length === 0) throw new Error('사용자 프로필을 찾을 수 없습니다.');
        const profile = profiles[0];

        // 2. 현재 시장 데이터(최근 수집된 10건씩) 가져오기
        const [jobs] = await db.execute('SELECT title, company, region FROM scraped_jobs ORDER BY created_at DESC LIMIT 10');
        const [edus] = await db.execute('SELECT title, institution, edu_period FROM scraped_education ORDER BY created_at DESC LIMIT 10');

        const marketData = { jobs, education: edus };

        // 3. Gemini를 통해 사주평 리포트 생성
        const report = await generateSajuPyeongReport(profile.parsed_text, marketData);

        // 4. 결과 DB 업데이트
        await db.execute(
            'UPDATE workgraphy_parsed SET assessment_report = ?, experience_summary = ? WHERE id = ?',
            [report, "종합 사주평(綜合 四柱評) 생성 완료", profileId]
        );

        return report;
    } catch (error) {
        console.error('❌ Assessment 생성 중 오류:', error.message);
        throw error;
    }
}

module.exports = {
    generateAssessment
};
