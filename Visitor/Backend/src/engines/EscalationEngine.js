class EscalationEngine {
  getEscalationChain(ruleName) {
    return {
      ruleName,
      levels: [
        { level: 1, target: 'Host Employee', timerMins: 15 },
        { level: 2, target: 'Reception Supervisor', timerMins: 30 },
        { level: 3, target: 'Security Lead', timerMins: 60 },
        { level: 4, target: 'System Administrator', timerMins: 1440 }
      ]
    };
  }
}

module.exports = new EscalationEngine();
