// Minimalistický test server pre Railway
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Simple test server' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/test', (req, res) => {
  res.json({
    env: {
      hasApiKey: !!process.env.API_KEY,
      hasSpreadsheetId: !!process.env.SPREADSHEET_ID,
      hasCredentials: !!process.env.GOOGLE_CREDENTIALS_BASE64,
      port: PORT
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test server running on 0.0.0.0:${PORT}`);
});
