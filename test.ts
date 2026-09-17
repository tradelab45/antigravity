import yahooFinance from 'yahoo-finance2';
async function run() { console.log(await yahooFinance.quoteSummary('RELIANCE.NS', { modules: ['calendarEvents'] })); } run();
