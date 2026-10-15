class QueueEngine {
  constructor() {
    this.queues = {
      pending: [],
      scheduled: [],
      processing: [],
      retry: [],
      completed: [],
      failed: [],
      deadLetter: []
    };
  }

  enqueue(job, queueName = 'pending') {
    const jobRecord = { jobId: `JOB-${Date.now()}-${Math.random().toString(36).substring(7)}`, job, enqueuedAt: new Date().toISOString() };
    if (this.queues[queueName]) {
      this.queues[queueName].push(jobRecord);
    }
    return jobRecord;
  }

  getStats() {
    return {
      pending: this.queues.pending.length,
      scheduled: this.queues.scheduled.length,
      processing: this.queues.processing.length,
      retry: this.queues.retry.length,
      completed: this.queues.completed.length,
      failed: this.queues.failed.length,
      deadLetter: this.queues.deadLetter.length
    };
  }
}

module.exports = new QueueEngine();
