class RetryEngine {
  calculateNextRetry(currentAttempt, maxRetries = 3, baseDelaySec = 60) {
    if (currentAttempt >= maxRetries) {
      return { sendToDeadLetterQueue: true, attempt: currentAttempt };
    }
    const backoffDelaySec = baseDelaySec * Math.pow(2, currentAttempt - 1);
    return {
      sendToDeadLetterQueue: false,
      nextAttempt: currentAttempt + 1,
      delaySec: backoffDelaySec,
      retryAt: new Date(Date.now() + backoffDelaySec * 1000).toISOString()
    };
  }
}

module.exports = new RetryEngine();
