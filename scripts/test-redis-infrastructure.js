import { redis } from "../src/lib/redis.js";
import { getCachedEvents, setCachedEvents, getCachedEventDetail, setCachedEventDetail, invalidateEventsCache } from "../src/server/services/eventsCacheService.js";
import { checkIdempotency, completeIdempotency } from "../src/lib/idempotency.js";
import { pushJob, processNextJob, QUEUES } from "../src/lib/redisQueue.js";

async function runRedisSuite() {
  console.log("\n=======================================================");
  console.log("🚀 STARTING UNCOOKED REDIS INFRASTRUCTURE TEST SUITE");
  console.log("=======================================================\n");

  const results = { passed: 0, failed: 0, total: 0 };

  function assert(condition, testName) {
    results.total++;
    if (condition) {
      results.passed++;
      console.log(`  ✅ PASS: ${testName}`);
    } else {
      results.failed++;
      console.error(`  ❌ FAIL: ${testName}`);
    }
  }

  // 1. Connection & Core Operations Test
  console.log("▶ [Test 1] Core Operations & Namespacing");
  const connectionStatus = redis.isRedisConnected();
  console.log(`   Redis Active: ${connectionStatus ? "YES (Live Redis)" : "NO (In-Memory Fallback)"}`);

  await redis.set("test:key", { foo: "bar" }, 60);
  const val = await redis.get("test:key");
  assert(val && val.foo === "bar", "Redis SET and GET retrieve structured JSON correctly");

  await redis.del("test:key");
  const valAfterDel = await redis.get("test:key");
  assert(valAfterDel === null, "Redis DEL successfully removes key");

  // 2. Cache-Aside Event Operations
  console.log("\n▶ [Test 2] Cache-Aside Strategy & Invalidation");
  const dummyListKey = "type:tech:zone:north";
  const dummyEvents = [{ id: "ev-test-1", title: "Tech Fest 2026" }];

  await setCachedEvents(dummyListKey, dummyEvents);
  const cachedList = await getCachedEvents(dummyListKey);
  assert(Array.isArray(cachedList) && cachedList[0].id === "ev-test-1", "getCachedEvents retrieves cached event array");

  await setCachedEventDetail("ev-test-1", dummyEvents[0]);
  const cachedDetail = await getCachedEventDetail("ev-test-1");
  assert(cachedDetail && cachedDetail.title === "Tech Fest 2026", "getCachedEventDetail retrieves single event detail");

  await invalidateEventsCache("ev-test-1");
  const postInvalidateList = await getCachedEvents(dummyListKey);
  const postInvalidateDetail = await getCachedEventDetail("ev-test-1");
  assert(postInvalidateList === null && postInvalidateDetail === null, "invalidateEventsCache clears event detail and listing keys");

  // 3. Sliding-Window Rate Limiting Test
  console.log("\n▶ [Test 3] Sliding-Window Rate Limiter");
  const testRateKey = "test-rate-limit-user";
  const limit = 3;
  const windowMs = 5000;

  const req1 = await redis.rateLimit(testRateKey, { limit, windowMs });
  const req2 = await redis.rateLimit(testRateKey, { limit, windowMs });
  const req3 = await redis.rateLimit(testRateKey, { limit, windowMs });
  const req4 = await redis.rateLimit(testRateKey, { limit, windowMs });

  assert(req1.success && req2.success && req3.success, "Requests under limit are allowed");
  assert(!req4.success && req4.remaining === 0 && req4.retryAfter > 0, "4th Request exceeding limit (3) is correctly blocked with HTTP 429 semantics");

  // 4. Temporary Data (OTP) Expiration
  console.log("\n▶ [Test 4] Temporary Data Storage & TTL");
  const otpKey = "otp:user-999";
  await redis.set(otpKey, { code: "987654" }, 1); // 1 sec TTL
  const immediateOtp = await redis.get(otpKey);
  assert(immediateOtp && immediateOtp.code === "987654", "OTP is readable immediately after set");

  await new Promise((resolve) => setTimeout(resolve, 1100)); // Wait for expiration
  const expiredOtp = await redis.get(otpKey);
  assert(expiredOtp === null, "OTP automatically expires after TTL");

  // 5. Background Job Queue Test
  console.log("\n▶ [Test 5] Background Queue Processing");
  const jobPayload = { to: "student@campus.edu", subject: "Welcome to Uncooked!" };
  await pushJob(QUEUES.NOTIFICATIONS, jobPayload);
  const processedJob = await processNextJob(QUEUES.NOTIFICATIONS);
  assert(processedJob && processedJob.success, "Background worker successfully dequeues and processes notification job");

  // 6. Idempotency Control System Test
  console.log("\n▶ [Test 6] Idempotency Control System");
  const idempotencyKey = "idempotency-token-12345";
  const check1 = await checkIdempotency(idempotencyKey);
  assert(!check1.isDuplicate, "Initial idempotency check proceeds (isDuplicate = false)");

  const check2 = await checkIdempotency(idempotencyKey);
  assert(check2.isDuplicate && check2.status === "PROCESSING", "Concurrent duplicate check returns status PROCESSING");

  await completeIdempotency(idempotencyKey, { eventId: "ev-test-1" });
  const check3 = await checkIdempotency(idempotencyKey);
  assert(check3.isDuplicate && check3.status === "COMPLETED" && check3.data.eventId === "ev-test-1", "Subsequent request returns cached COMPLETED payload");

  // 7. Observability & Health Metrics
  console.log("\n▶ [Test 7] Observability & Health Metrics");
  const metrics = redis.getMetrics();
  console.log("   Redis Metrics Snapshot:", JSON.stringify(metrics, null, 2));
  assert(metrics.hits > 0 && metrics.sets > 0 && metrics.rateLimitBlocked > 0, "Observability counters accurately record infrastructure metrics");

  // Cleanup
  await redis.flushNamespace();

  console.log("\n=======================================================");
  console.log(`📊 TEST SUITE SUMMARY: ${results.passed}/${results.total} Passed (${results.failed} Failed)`);
  console.log("=======================================================\n");

  if (results.failed > 0) {
    process.exit(1);
  }
}

runRedisSuite().catch((err) => {
  console.error("❌ Test suite fatal error:", err);
  process.exit(1);
});
