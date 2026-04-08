const db = require('../database');
const { generateAssessment } = require('./geminiService');

/**
 * Orchestrates the AI career assessment process.
 * Fetches user profile and relevant job data, then generates a report.
 */
async function processUserAssessment(workgraphyId) {
    console.log(`--- Processing Assessment for ID: ${workgraphyId} ---`);
    try {
        const [rows] = await db.execute('SELECT * FROM workgraphy_parsed WHERE id = ?', [workgraphyId]);
        if (rows.length === 0) throw new Error('Workgraphy data not found.');

        const profileText = rows[0].raw_text;

        // Fetch top 5 relevant jobs for context
        const [jobs] = await db.execute('SELECT title, company, region FROM scraped_jobs ORDER BY id DESC LIMIT 5');

        const assessmentText = await generateAssessment(profileText, jobs);

        // Update the record with the generated assessment
        await db.execute('UPDATE workgraphy_parsed SET assessment_report = ? WHERE id = ?', [assessmentText, workgraphyId]);

        console.log('✅ Assessment Report Processed and Saved.');
        return assessmentText;
    } catch (error) {
        console.error('❌ Matching Engine Error:', error.message);
        throw error;
    }
}

module.exports = { processUserAssessment };
