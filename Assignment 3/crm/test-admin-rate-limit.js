const API_URL = "http://127.0.0.1:3000/api/users"; // Admin route (Limit 200)

async function testAdminRateLimit() {
  console.log("🚀 Starting Rate Limit Test on Admin Route...");
  console.log("Please ensure the Next.js server is running and you replace 'YOUR_TOKEN_HERE' below with a valid admin JWT cookie value.");
  
  // NOTE: To test this, login as admin in your browser, copy the 'crm_token' cookie, and paste it here
  const MOCK_ADMIN_TOKEN = "YOUR_TOKEN_HERE"; 
  
  if (MOCK_ADMIN_TOKEN === "YOUR_TOKEN_HERE") {
    console.log("\n⚠️ Please edit this script to include a valid crm_token to test the 200 requests limit.");
    return;
  }

  let successCount = 0;
  let blockedCount = 0;
  
  console.log("\nSending 210 requests (Expect 200 success, 10 blocked)...");
  
  const requests = [];
  
  for (let i = 1; i <= 210; i++) {
    requests.push(
      fetch(API_URL, {
        headers: { 
          "Cookie": `crm_token=${MOCK_ADMIN_TOKEN}`,
          "x-forwarded-for": "192.168.1.100" 
        }
      }).then(res => {
        if (res.status === 429) {
          blockedCount++;
        } else if (res.status === 200) {
          successCount++;
        }
      }).catch(() => {})
    );
  }
  
  // Wait for all concurrent requests to finish
  await Promise.all(requests);
  
  console.log("\n--- 📊 Admin Test Results ---");
  console.log(`Allowed: ${successCount} (Expected: 200)`);
  console.log(`Blocked: ${blockedCount} (Expected: 10)`);
  
  if (successCount === 200 && blockedCount === 10) {
    console.log("\n✅ SUCCESS: Admin rate limiting is working perfectly!");
  } else {
    console.log("\n⚠️ WARNING: Rate limit results did not match expectations.");
  }
}

testAdminRateLimit();
