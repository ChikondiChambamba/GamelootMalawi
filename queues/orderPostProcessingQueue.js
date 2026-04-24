const { Queue } = require('bullmq');
const { createRedisConnection } = require('../config/redis');

const ORDER_POST_PROCESSING_QUEUE = 'order-post-processing';

let queue;

function getOrderPostProcessingQueue() {
  if (!queue) {
    queue = new Queue(ORDER_POST_PROCESSING_QUEUE, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: Number(process.env.ORDER_POST_PROCESSING_ATTEMPTS || 3),
        backoff: {
          type: 'exponential',
          delay: Number(process.env.ORDER_POST_PROCESSING_BACKOFF_MS || 5000)
        },
        removeOnComplete: 1000,
        removeOnFail: 1000
      }
    });
  }
  return queue;
}

async function enqueueOrderPostProcessingJob(payload) {
  const orderId = payload && payload.order && payload.order.id ? String(payload.order.id) : `${Date.now()}`;
  return getOrderPostProcessingQueue().add('process-order-confirmation', payload, {
    jobId: `order-post-processing:${orderId}`
  });
}

module.exports = {
  ORDER_POST_PROCESSING_QUEUE,
  getOrderPostProcessingQueue,
  enqueueOrderPostProcessingJob
};
