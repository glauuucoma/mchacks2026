const axios = require('axios');

const payload = {
  scan_id: "your-scan-id",
  ticker: "AAPL",
  news_summary: "Sample news summary",
  reddit_sentiment: "Bullish",
  trader_signal: "Buy"
};

axios.post('http://127.0.0.1:8000/api/webhook/gumloop_result', payload)
  .then(response => {
    console.log('Status:', response.status);
    console.log('Response:', response.data);
  })
  .catch(error => {
    if (error.response) {
      console.error('Error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  });