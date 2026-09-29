const http = require('http');
const data = JSON.stringify({ question: 'Tell me about Hero Splendor' });
const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/ask',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', body));
});
req.on('error', console.error);
req.write(data);
req.end();
