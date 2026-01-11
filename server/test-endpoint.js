const http = require('http');

const data = JSON.stringify({
  chatHistory: [{ content: "Hello", senderId: "user1", timestamp: new Date() }],
  autoMode: false
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/generate-suggestions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log("Sending request to http://localhost:3001/api/generate-suggestions ...");
const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log(`BODY: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
