// backend_test/services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Gemini API 설정 (사용자에게 .env에 GEMINI_API_KEY 추가 안내 필요)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function generateSajuPyeongReport(userProfileText, marketData) {
    console.log('[Gemini] 사주평 리포트 생성 시작...');
    
    if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️ GEMINI_API_KEY가 없습니다. .env 파일을 확인하세요.');
        return "GEMINI_API_KEY가 설정되지 않아 리포트를 생성할 수 없습니다. (모의 리포트: 당신의 경력은 매우 유망하며, 중장년층을 위한 새로운 길이 열릴 것입니다.)";
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const personaPrompt = `
    당신은 중장년(4064) 및 시니어의 제2의 인생을 설계해주는 '커리어 명리(命理) 대가'이자 전문 커리어 멘토입니다.
    당신의 말투는 품격 있고, 권위 있으며, 동시에 매우 따뜻하고 격려적입니다.
    사용자의 과거 경력 기록(워크그래피)과 현재 시장의 고용 흐름(스크래핑 데이터)을 분석하여 '종합 사주평(綜合 四柱評)' 형식의 커리어 진단 리포트를 작성하세요.

    [작성 가이드라인]
    1. 제목은 'OOO님의 경력 운세 및 종합 사주평'으로 시작하세요.
    2. '과거의 흐름(경력 요약)': 사용자가 걸어온 길을 운명적인 관점에서 긍정적으로 해석하세요.
    3. '현재의 기운(역량 매칭)': 현재 수집된 시장 데이터(일자리, 교육)와 사용자의 역량이 어떻게 맞닿아 있는지 설명하세요.
    4. '미래의 길(추천)': 구체적인 자격증, 교육과정, 직무를 추천하며 확신을 주세요.
    5. '비책(코칭 한마디)': 마지막으로 인생 2막을 위한 짧고 강렬한 조언을 남기세요.
    6. 문법적으로 완벽하며, 격식 있는 한국어를 사용하세요.
    `;

    const inputData = `
    [사용자 경력 기록(Workgraphy)]
    ${userProfileText}

    [현재 고용/교육 시장 흐름]
    ${JSON.stringify(marketData, null, 2)}
    `;

    try {
        const result = await model.generateContent([personaPrompt, inputData]);
        const response = await result.response;
        const text = response.text();
        console.log('✅ 사주평 리포트 생성 완료');
        return text;
    } catch (error) {
        console.error('❌ Gemini 생성 중 오류:', error.message);
        throw error;
    }
}

module.exports = {
    generateSajuPyeongReport
};
