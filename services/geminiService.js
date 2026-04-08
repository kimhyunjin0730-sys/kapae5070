const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates a career assessment report using Gemini AI.
 * Persona: Career Mentor / Professional Fortune Teller (Saju-pyeong style).
 */
async function generateAssessment(profileText, marketData) {
    console.log('--- Gemini Assessment Generation Started ---');
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
당신은 대한민국 최고의 중장년 커리어 컨설턴트이자, 인생의 흐름을 읽는 전문 '사주평' 전문가입니다.
사용자의 경력 데이터(워크그래피)와 현재 고용 시장 데이터를 분석하여, 격려와 권위가 담긴 분석 리포트를 작성하세요.

[분석 지침]
1. 말투: 정중하고 신뢰감 있으며, 약간의 신비로움(운명, 흐름, 기운 등)을 섞은 전문적인 '사주평' 스타일로 작성하세요.
2. 구조: 
   - 🌟 [총평: 현재의 운때와 역량의 조화]
   - 💎 [핵심 보석: 당신만의 암묵지 강점]
   - 📈 [시장의 흐름: 지금 연결될 수 있는 기회]
   - 📍 [조언: 앞으로 나아갈 방향]
3. 내용: 사용자의 'raw_text'에서 추출된 경력과 'market_data'에 있는 구인 정보를 매칭하여 구체적으로 언급하세요.

[사용자 데이터]
${profileText}

[시장 데이터 샘플]
${JSON.stringify(marketData)}

결과는 마크다운 형식을 사용하지 말고, 깔끔한 텍스트 줄바꿈으로만 전달하세요.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ Gemini Assessment Generated Successfully.');
        return text;
    } catch (error) {
        console.error('❌ Gemini Service Error:', error.message);
        throw error;
    }
}

module.exports = { generateAssessment };
