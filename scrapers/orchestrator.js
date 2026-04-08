const { scrapeMoel } = require('./moelScraper');
const { scrapeSeniorro } = require('./seniorroScraper');
const { scrapeWorknet } = require('./worknetScraper');

async function runAllScrapers() {
    console.log('=== Global Employment Data Collection Started ===');
    const results = {};
    try {
        results.moel = await scrapeMoel();
        results.seniorro = await scrapeSeniorro();
        results.worknet = await scrapeWorknet();
        
        console.log('=== All Scraping Tasks Completed Successfully ===');
        return results;
    } catch (error) {
        console.error('❌ Scraper Orchestrator Error:', error.message);
        throw error;
    }
}

module.exports = { runAllScrapers };
