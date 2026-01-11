const http = require('http');

const data = JSON.stringify({
  chatHistory: [],
  autoMode: false
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/generate-suggestions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log("Sending request...");
const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
