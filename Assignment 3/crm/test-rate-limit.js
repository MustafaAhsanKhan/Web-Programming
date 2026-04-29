const API_URL = "http://127.0.0.1:3000/api/auth/login";

async function testPublicRateLimit() {
  console.log("🚀 Starting Rate Limit Test on Public Route...");
  console.log("Expected Behavior: First 10 requests allowed, remaining 5 blocked (429).\n");
  
  let successCount = 0;
  let blockedCount = 0;
  
  // Send 15 consecutive requests
  for (let i = 1; i <= 15; i++) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          // Spoofing an IP to ensure we test a clean bucket if run multiple times
          "x-forwarded-for": "192.168.1.99" 
        },
        body: JSON.stringify({ email: "test@example.com", password: "wrong_password" })
      });
      
      if (res.status === 429) {
        blockedCount++;
        console.log(`[Request ${i.toString().padStart(2, '0')}] ❌ BLOCKED - HTTP 429 Too Many Requests`);
      } else {
        successCount++;
        console.log(`[Request ${i.toString().padStart(2, '0')}] ✅ ALLOWED - HTTP ${res.status}`);
      }
    } catch (err) {
      console.error(`[Request ${i}] Error:`, err.message);
    }
    
    // Tiny delay to ensure ordered console logs
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log("\n--- 📊 Test Results ---");
  console.log(`Allowed: ${successCount} (Expected: 10)`);
  console.log(`Blocked: ${blockedCount} (Expected: 5)`);
  
  if (successCount === 10 && blockedCount === 5) {
    console.log("\n✅ SUCCESS: Rate limiting is working perfectly!");
  } else {
    console.log("\n⚠️ WARNING: Rate limit results did not match expectations. Check the API implementation.");
  }
}

testPublicRateLimit();
