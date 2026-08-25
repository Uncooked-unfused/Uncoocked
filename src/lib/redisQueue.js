import { redis } from "./redis.js";
import { sendEmail } from "../server/services/emailService.js";

/**
 * Redis-Backed Asynchronous Job Queue System.
 * Supports background processing for emails, notifications, and heavy computations.
 */

export const QUEUES = {
  EMAILS: "emails",
  NOTIFICATIONS: "notifications",
  ANALYTICS: "analytics",
};

/**
 * Dispatch a job to the background queue.
 */
export async function pushJob(queueName, payload) {
  try {
    await redis.enqueueJob(queueName, payload);
    return true;
  } catch (err) {
    console.error(`⚠️ Failed to push job to queue "${queueName}":`, err.message);
    return false;
  }
}

/**
 * Process a single pending job from the queue.
 */
export async function processNextJob(queueName) {
  const job = await redis.dequeueJob(queueName);
  if (!job) return null;

  try {
    switch (queueName) {
      case QUEUES.EMAILS:
        await sendEmail(job.data);
        break;
      case QUEUES.NOTIFICATIONS:
        console.log("🔔 [Queue Worker] Processing notification job:", job.data);
        break;
      case QUEUES.ANALYTICS:
        console.log("📊 [Queue Worker] Processing analytics job:", job.data);
        break;
      default:
        console.warn(`⚠️ Unknown queue name: "${queueName}"`);
    }
    return { success: true, jobId: job.id };
  } catch (err) {
    console.error(`❌ [Queue Worker Error] Failed processing job "${job.id}":`, err.message);
    return { success: false, jobId: job.id, error: err.message };
  }
}

/**
 * Process all pending jobs in a queue batch.
 */
export async function processQueueBatch(queueName, maxBatchSize = 10) {
  let count = 0;
  while (count < maxBatchSize) {
    const res = await processNextJob(queueName);
    if (!res) break; // Queue empty
    count++;
  }
  return count;
}
