const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost', port: 3001, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const str = Buffer.concat(chunks).toString();
        try { resolve(JSON.parse(str)); } catch(e) { resolve(str); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const raw = await post('/api/v1/auth/register', { email: 'test@test.com', password: 'test1234', fullName: 'Test User' });
  console.log('Register:', JSON.stringify(raw, null, 2));
}

main().catch(e => console.error(e));
