const db = require('../../../config/db');

class QueueManagerService {
  constructor() {
    this.isPaused = false;
    this.workerInterval = null;
    this.initQueueWorker();
  }

  /**
   * Enqueue notification task into DB queue
   */
  async enqueue(notificationId, channel, recipientUserId, recipientAddress, payload = {}) {
    try {
      const res = await db.query(
        `INSERT INTO notification_queues
          (notification_id, channel, recipient_user_id, recipient_address, payload_json, status, attempt_count, max_attempts, scheduled_at)
         VALUES (?, ?, ?, ?, ?, 'queued', 0, 3, NOW())`,
        [
          notificationId,
          channel,
          recipientUserId || null,
          recipientAddress || null,
          JSON.stringify(payload)
        ]
      );

      console.log(`[QueueManager] Enqueued task #${res.insertId} for notification #${notificationId} via ${channel}`);
      return res.insertId;
    } catch (err) {
      console.error('Error enqueuing notification task:', err);
      return null;
    }
  }

  /**
   * Asynchronous Queue Worker Process Loop
   */
  initQueueWorker() {
    if (this.workerInterval) clearInterval(this.workerInterval);
    this.workerInterval = setInterval(() => {
      if (!this.isPaused) {
        this.processPendingTasks().catch(() => {});
      }
    }, 5000); // Polls every 5s
  }

  async processPendingTasks() {
    try {
      const tasks = await db.query(
        `SELECT * FROM notification_queues
         WHERE status IN ('queued', 'retrying') AND scheduled_at <= NOW()
         ORDER BY id ASC LIMIT 10`
      );

      if (!Array.isArray(tasks) || tasks.length === 0) return;

      for (const task of tasks) {
        await this.processSingleTask(task);
      }
    } catch (err) {
      // Worker silent catch
    }
  }

  async processSingleTask(task) {
    try {
      // Mark as processing
      await db.query(
        `UPDATE notification_queues SET status = 'processing', updated_at = NOW() WHERE id = ?`,
        [task.id]
      );

      // Perform simulated channel delivery (Email, SMS, Push, InApp)
      let deliverySuccess = true;

      if (deliverySuccess) {
        await db.query(
          `UPDATE notification_queues SET status = 'sent', processed_at = NOW() WHERE id = ?`,
          [task.id]
        );
      }
    } catch (err) {
      const attempts = (task.attempt_count || 0) + 1;
      const maxAttempts = task.max_attempts || 3;

      if (attempts >= maxAttempts) {
        await db.query(
          `UPDATE notification_queues SET status = 'failed', attempt_count = ?, last_error = ? WHERE id = ?`,
          [attempts, err.message || 'Worker delivery error', task.id]
        );
      } else {
        // Schedule backoff retry
        await db.query(
          `UPDATE notification_queues SET status = 'retrying', attempt_count = ?, scheduled_at = DATE_ADD(NOW(), INTERVAL 1 MINUTE) WHERE id = ?`,
          [attempts, task.id]
        );
      }
    }
  }

  // Queue Control Interfaces
  pauseWorker() {
    this.isPaused = true;
    console.log('[QueueManager] Worker process PAUSED.');
    return { success: true, message: 'Queue worker paused' };
  }

  resumeWorker() {
    this.isPaused = false;
    console.log('[QueueManager] Worker process RESUMED.');
    return { success: true, message: 'Queue worker resumed' };
  }

  async flushRetryQueue() {
    try {
      await db.query(
        `UPDATE notification_queues SET status = 'queued', attempt_count = 0, scheduled_at = NOW() WHERE status IN ('failed', 'retrying')`
      );
      return { success: true, message: 'Retry queue flushed successfully' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = new QueueManagerService();
