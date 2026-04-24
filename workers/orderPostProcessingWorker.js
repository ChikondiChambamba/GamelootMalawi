require('dotenv').config();

const { Worker } = require('bullmq');
const logger = require('../utils/logger');
const { createRedisConnection, getRedisConfig } = require('../config/redis');
const { ORDER_POST_PROCESSING_QUEUE } = require('../queues/orderPostProcessingQueue');
const { runOrderPostProcessing } = require('../utils/orderPostProcessing');

const worker = new Worker(
  ORDER_POST_PROCESSING_QUEUE,
  async (job) => {
    await runOrderPostProcessing(job.data);
  },
  {
    connection: createRedisConnection(),
    concurrency: Number(process.env.ORDER_POST_PROCESSING_CONCURRENCY || 2)
  }
);

worker.on('ready', () => {
  logger.info('order_post_processing_worker_ready', {
    queue: ORDER_POST_PROCESSING_QUEUE,
    redis: getRedisConfig().summary
  });
});

worker.on('completed', (job) => {
  logger.info('order_post_processing_job_completed', {
    jobId: job.id,
    queue: ORDER_POST_PROCESSING_QUEUE
  });
});

worker.on('failed', (job, err) => {
  logger.error('order_post_processing_job_failed', {
    jobId: job && job.id,
    queue: ORDER_POST_PROCESSING_QUEUE,
    error: err && err.message ? err.message : String(err)
  });
});

worker.on('error', (err) => {
  logger.error('order_post_processing_worker_error', {
    queue: ORDER_POST_PROCESSING_QUEUE,
    error: err && err.message ? err.message : String(err)
  });
});

async function shutdown(signal) {
  logger.info('order_post_processing_worker_shutdown', {
    queue: ORDER_POST_PROCESSING_QUEUE,
    signal
  });
  try {
    await worker.close();
    process.exit(0);
  } catch (err) {
    logger.error('order_post_processing_worker_shutdown_failed', {
      queue: ORDER_POST_PROCESSING_QUEUE,
      error: err && err.message ? err.message : String(err)
    });
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

module.exports = worker;
