const pdf = require('pdf-parse');
const db = require('../database');

/**
 * Extracts text from a Workgraphy PDF e-book.
 * @param {Buffer} buffer - The PDF file as a buffer.
 */
async function parseWorkgraphyPDF(buffer) {
    console.log('--- Workgraphy PDF Parsing Started ---');
    try {
        const data = await pdf(buffer);
        const text = data.text;
        
        console.log(`✅ Extracted ${text.length} characters from PDF.`);
        
        return {
            pageCount: data.numpages,
            text: text,
            info: data.info,
            metadata: data.metadata
        };
    } catch (error) {
        console.error('❌ PDF Parsing Error:', error.message);
        throw error;
    }
}

/**
 * Saves the parsed text to the database.
 * @param {string} userId - Reference to the user who uploaded the file.
 * @param {string} rawText - The full extracted text.
 */
async function saveParsedWorkgraphy(userId, rawText) {
    const query = 'INSERT INTO workgraphy_parsed (user_id, raw_text) VALUES (?, ?)';
    const [result] = await db.execute(query, [userId, rawText]);
    return result.insertId;
}

module.exports = { parseWorkgraphyPDF, saveParsedWorkgraphy };
