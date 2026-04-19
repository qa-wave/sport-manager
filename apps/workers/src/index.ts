/**
 * BullMQ worker process.
 *
 * Future queues:
 *   - notifications  (push, email, SMS)
 *   - bulk-comms     (admin broadcasts to whole club)
 *   - reminders      (RSVP nags, payment due)
 *   - stripe-events  (webhook fan-out)
 *
 * For now this just boots a Redis connection and a `notifications` worker
 * stub so the deploy target compiles end-to-end.
 */
import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

type NotificationJob = {
  kind: 'push' | 'email';
  to: string;
  subject?: string;
  body: string;
};

const notifications = new Worker<NotificationJob>(
  'notifications',
  async (job: Job<NotificationJob>) => {
    console.log(`[notifications] ${job.id} kind=${job.data.kind} to=${job.data.to}`);
    // TODO: dispatch to Expo Push / Resend
    return { ok: true };
  },
  { connection },
);

notifications.on('failed', (job, err) => {
  console.error(`[notifications] FAILED ${job?.id}:`, err);
});

console.log('Workers ready.');
