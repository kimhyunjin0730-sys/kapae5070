// backend_test/services/workgraphyService.js
const fs = require('fs');
const pdf = require('pdf-parse');
const db = require('./db');

async function parseWorkgraphyEbook(filePath, userName) {
    console.log(`[Workgraphy] e-book 파싱 시작: ${filePath}`);
    const dataBuffer = fs.readFileSync(filePath);

    try {
        const data = await pdf(dataBuffer);
        const fullText = data.text;
        
        // 간단한 요약 (Text 기반, 실제는 Gemini로 더 정교하게 처리)
        const summary = fullText.substring(0, 500) + '...';
        
        // DB 저장
        const [result] = await db.execute(
            `INSERT INTO workgraphy_parsed (user_name, file_name, parsed_text, summary) 
             VALUES (?, ?, ?, ?)`,
            [userName, filePath.split(/[\/\\]/).pop(), fullText, summary]
        );

        console.log('✅ Workgraphy 데이터 파싱 및 DB 저장 완료. ID:', result.insertId);
        return {
            id: result.insertId,
            text: fullText,
            summary: summary
        };
    } catch (error) {
        console.error('❌ PDF 파싱 실패:', error.message);
        throw error;
    }
}

module.exports = {
    parseWorkgraphyEbook
};
