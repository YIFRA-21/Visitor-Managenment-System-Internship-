class RuleEvaluationEngine {
  evaluateCondition(fieldValue, operator, targetValue) {
    switch (operator) {
      case 'eq': case '==': return fieldValue == targetValue;
      case 'neq': case '!=': return fieldValue != targetValue;
      case 'gt': case '>': return Number(fieldValue) > Number(targetValue);
      case 'lt': case '<': return Number(fieldValue) < Number(targetValue);
      case 'contains': return String(fieldValue).toLowerCase().includes(String(targetValue).toLowerCase());
      case 'startsWith': return String(fieldValue).startsWith(String(targetValue));
      case 'endsWith': return String(fieldValue).endsWith(String(targetValue));
      case 'isEmpty': return !fieldValue || fieldValue === '';
      case 'isNotEmpty': return !!fieldValue && fieldValue !== '';
      default: return true;
    }
  }

  evaluateRules(rules, payload) {
    const matchedRules = [];
    for (const rule of rules) {
      // Evaluate conditions if defined
      let matched = true;
      if (rule.conditions && Array.isArray(rule.conditions)) {
        matched = rule.conditions.every(c => {
          const val = payload[c.field];
          return this.evaluateCondition(val, c.operator, c.value);
        });
      }
      if (matched) {
        matchedRules.push(rule);
      }
    }
    return matchedRules;
  }
}

module.exports = new RuleEvaluationEngine();
