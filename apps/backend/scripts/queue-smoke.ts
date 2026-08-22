import { Queue, QueueEvents, Worker } from 'bullmq';

interface AnalysisSmokePayload {
  analysisId: string;
  userId: string;
}

const ANALYSIS_QUEUE_NAME = 'analysis-processing';
const ANALYSIS_PROCESSING_JOB_NAME = 'analysis.process';

async function run(): Promise<void> {
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6380';
  const queueName = ANALYSIS_QUEUE_NAME;
  const payload: AnalysisSmokePayload = {
    analysisId: `analysis-${Date.now()}`,
    userId: 'smoke-user',
  };

  const queue = new Queue<AnalysisSmokePayload>(queueName, {
    connection: { url: redisUrl },
  });
  const events = new QueueEvents(queueName, {
    connection: { url: redisUrl },
  });

  let failOnce = true;

  const worker = new Worker<AnalysisSmokePayload>(
    queueName,
    async (job) => {
      if (failOnce) {
        failOnce = false;
        throw new Error('intentional smoke retry');
      }

      return {
        processed: true,
        analysisId: job.data.analysisId,
      };
    },
    {
      connection: { url: redisUrl },
      concurrency: 1,
    },
  );

  try {
    await worker.waitUntilReady();
    await events.waitUntilReady();

    const job = await queue.add(ANALYSIS_PROCESSING_JOB_NAME, payload, {
      jobId: `analysis-${payload.analysisId}`,
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 100,
      },
      removeOnComplete: true,
      removeOnFail: true,
    });

    await job.waitUntilFinished(events, 20_000);

    console.log('Queue smoke succeeded');
    console.log(`queue=${queueName}`);
    console.log(`jobId=${String(job.id)}`);
    console.log('retryPolicy=attempts:2,backoff:fixed:100ms');
  } finally {
    await Promise.all([worker.close(), events.close(), queue.close()]);
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown queue smoke failure';
  console.error('Queue smoke failed', message);
  process.exit(1);
});
