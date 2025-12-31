const http = require('http');

function measure(url) {
  return new Promise((resolve) => {
    const start = process.hrtime();
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const diff = process.hrtime(start);
        const ms = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);
        resolve({ status: res.statusCode, time: parseFloat(ms), size: data.length });
      });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function run() {
  console.log("Measuring Performance...");
  
  // Warmup (Next.js dev server is slow on first request)
  await measure('http://localhost:3000/'); 
  
  console.log("1. Home Page (http://localhost:3000/)");
  const home = await measure('http://localhost:3000/');
  if (home.error) console.error("   Error:", home.error);
  else console.log(`   Time: ${home.time}ms (Status: ${home.status}, Size: ${home.size}b)`);

  console.log("2. API Search (http://localhost:3000/api/search?q=e)");
  const api = await measure('http://localhost:3000/api/search?q=e');
  if (api.error) console.error("   Error:", api.error);
  else console.log(`   Time: ${api.time}ms (Status: ${api.status}, Size: ${api.size}b)`);

  console.log("-------------");
  if (home.time < 2000) console.log("[PASS] Home Page < 2s");
  else console.error("[FAIL] Home Page > 2s");

  if (api.time < 500) console.log("[PASS] API < 500ms");
  else console.error("[FAIL] API > 500ms");
}

run();
