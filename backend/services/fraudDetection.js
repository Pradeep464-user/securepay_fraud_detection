const Transaction = require('../models/Transaction');

/**
 * Rule-Based Fraud Detection Engine for SecurePay
 * Analyzes:
 *  1. Transaction amount (absolute and relative to historical average)
 *  2. Transaction frequency / velocity (past 2m, 10m, rapid bursts)
 *  3. Transaction timing (unusual hours: 01:00 - 05:00)
 *  4. Historical transaction behavior
 * 
 * Explicitly rule-based: No ML, no location, no device fingerprinting.
 */
async function analyzeTransactionRisk({ senderId, amount, txTimestamp = new Date(), customHour = null }) {
  const reasons = [];
  const now = new Date(txTimestamp);
  const hour = customHour !== null ? customHour : now.getHours();

  // 1. Fetch historical completed/monitored transactions for sender
  const pastTransactions = await Transaction.find({
    sender: senderId,
    status: { $in: ['COMPLETED', 'MONITORED', 'UNDER_REVIEW'] }
  }).sort({ createdAt: -1 });

  const totalPastCount = pastTransactions.length;
  let historicalAverage = 0;

  if (totalPastCount > 0) {
    const totalAmount = pastTransactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);
    historicalAverage = Math.round((totalAmount / totalPastCount) * 100) / 100;
  }

  // ----------------------------------------------------
  // RULE 1: Transaction Amount Analysis (amountScore: 0-100)
  // ----------------------------------------------------
  let amountScore = 0;

  // A. Historical behavioral comparison
  if (totalPastCount >= 2 && historicalAverage > 0) {
    const ratio = amount / historicalAverage;
    if (ratio >= 8) {
      amountScore += 55;
      reasons.push(`Transaction amount (₹${amount.toLocaleString('en-IN')}) is ${ratio.toFixed(1)}x higher than user's historical average (₹${historicalAverage.toLocaleString('en-IN')})`);
    } else if (ratio >= 4) {
      amountScore += 40;
      reasons.push(`Transaction amount (₹${amount.toLocaleString('en-IN')}) is ${ratio.toFixed(1)}x higher than user's historical average (₹${historicalAverage.toLocaleString('en-IN')})`);
    } else if (ratio >= 2.5) {
      amountScore += 25;
      reasons.push(`Transaction amount is ${ratio.toFixed(1)}x user's historical average`);
    }
  }

  // B. Absolute Amount Thresholds
  if (amount >= 50000) {
    amountScore += 55;
    reasons.push(`Critical transfer volume: ₹${amount.toLocaleString('en-IN')} exceeds extreme threshold (₹50,000)`);
  } else if (amount >= 20000) {
    amountScore += 40;
    reasons.push(`High transfer volume: ₹${amount.toLocaleString('en-IN')} exceeds high-risk tier (₹20,000)`);
  } else if (amount >= 10000) {
    amountScore += 25;
    reasons.push(`Substantial transfer: ₹${amount.toLocaleString('en-IN')} exceeds standard threshold (₹10,000)`);
  } else if (amount >= 5000) {
    amountScore += 12;
  }

  amountScore = Math.min(100, amountScore);

  // ----------------------------------------------------
  // RULE 2: Transaction Velocity / Frequency (frequencyScore: 0-100)
  // ----------------------------------------------------
  let frequencyScore = 0;
  const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  const txInLast2Min = pastTransactions.filter(tx => new Date(tx.createdAt) >= twoMinutesAgo);
  const txInLast10Min = pastTransactions.filter(tx => new Date(tx.createdAt) >= tenMinutesAgo);

  const count2Min = txInLast2Min.length;
  const count10Min = txInLast10Min.length;

  // Immediate rapid burst (time since most recent transaction)
  if (pastTransactions.length > 0) {
    const mostRecentTxTime = new Date(pastTransactions[0].createdAt).getTime();
    const secondsSinceLast = Math.round((now.getTime() - mostRecentTxTime) / 1000);

    if (secondsSinceLast >= 0 && secondsSinceLast <= 25) {
      frequencyScore += 45;
      reasons.push(`Rapid consecutive transactions detected: previous transaction occurred only ${secondsSinceLast}s ago`);
    }
  }

  // Velocity checks
  if (count2Min >= 4) {
    frequencyScore += 55;
    reasons.push(`Severe velocity spike: ${count2Min} transactions executed within the last 2 minutes`);
  } else if (count2Min >= 2) {
    frequencyScore += 35;
    reasons.push(`High transaction frequency: ${count2Min} transactions executed within the last 2 minutes`);
  }

  if (count10Min >= 6) {
    frequencyScore += 30;
    reasons.push(`Elevated velocity: ${count10Min} transactions executed within the last 10 minutes`);
  } else if (count10Min >= 4) {
    frequencyScore += 15;
  }

  frequencyScore = Math.min(100, frequencyScore);

  // ----------------------------------------------------
  // RULE 3: Transaction Timing Analysis (timingScore: 0-100)
  // ----------------------------------------------------
  let timingScore = 0;

  // Anomalous dormant hours: 01:00 AM - 04:59 AM
  if (hour >= 1 && hour < 5) {
    timingScore = 55;
    reasons.push(`Unusual timing pattern: Transaction initiated during high-risk night hours (${hour.toString().padStart(2, '0')}:00)`);
  } else if (hour >= 23 || hour === 0 || hour === 5) {
    timingScore = 25;
    reasons.push(`Late-night transaction timestamp (${hour.toString().padStart(2, '0')}:00)`);
  } else {
    timingScore = 0;
  }

  // ----------------------------------------------------
  // RULE 4: Composite Risk Scoring & Escalation Rules
  // ----------------------------------------------------
  let compositeScore = (0.45 * amountScore) + (0.35 * frequencyScore) + (0.20 * timingScore);

  // Escalation rule: Simultaneous high amount and high frequency
  if (amountScore >= 45 && frequencyScore >= 45) {
    compositeScore = Math.max(compositeScore, 85);
    reasons.push('Critical escalation: Simultaneous high transaction value and rapid velocity burst detected');
  }

  // Escalation rule: Extreme amount anomaly
  if (amountScore >= 80) {
    compositeScore = Math.max(compositeScore, 75);
    reasons.push('Critical escalation: Abnormal transaction value triggers automatic high-risk threshold');
  }

  // Escalation rule: Severe velocity alone
  if (frequencyScore >= 80) {
    compositeScore = Math.max(compositeScore, 75);
    reasons.push('Critical escalation: Excessive transaction frequency triggers automatic high-risk threshold');
  }

  // Escalation rule: High amount + night hours
  if (amountScore >= 50 && timingScore >= 50) {
    compositeScore = Math.max(compositeScore, 75);
    reasons.push('Critical escalation: High-value transaction executed during anomalous night hours');
  }

  const finalRiskScore = Math.min(100, Math.max(0, Math.round(compositeScore)));

  // Risk Level mapping
  // 0 - 39: LOW
  // 40 - 69: MEDIUM
  // 70 - 100: HIGH
  let riskLevel;
  let status;

  if (finalRiskScore >= 70) {
    riskLevel = 'HIGH';
    status = 'UNDER_REVIEW'; // Suspicious activity requiring analyst review
  } else if (finalRiskScore >= 40) {
    riskLevel = 'MEDIUM';
    status = 'MONITORED';
  } else {
    riskLevel = 'LOW';
    status = 'COMPLETED';
  }

  if (reasons.length === 0) {
    reasons.push('Standard transaction parameters within normal behavioral baseline');
  }

  return {
    amountScore,
    frequencyScore,
    timingScore,
    riskScore: finalRiskScore,
    riskLevel,
    status,
    reasons,
    historicalAverage,
    recentCount: count2Min,
    timingHour: hour
  };
}

module.exports = {
  analyzeTransactionRisk
};
