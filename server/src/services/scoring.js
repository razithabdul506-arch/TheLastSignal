import { getDb } from '../database/init.js';

const CORRECT_CULPRIT = 'NIKHIL';

export function calculateFinalScore(participantId, accusedPerson, eventId) {
  const db = getDb();

  const participant = db.prepare(`
    SELECT * FROM participants WHERE id = ?
  `).get(participantId);

  const event = db.prepare(`
    SELECT * FROM events WHERE id = ?
  `).get(eventId);

  // 1. Innocence score (35%) - based on guilt reduction
  const guiltReduction = 100 - participant.guilt;
  const innocenceScore = Math.min(35, Math.round((guiltReduction / 100) * 35));

  // 2. Evidence discovery score (20%) - count of discovered evidence
  const discoveredCount = db.prepare(`
    SELECT COUNT(*) as count FROM evidence_discoveries
    WHERE participant_id = ?
  `).get(participantId).count;

  const totalEvidenceCount = db.prepare(`
    SELECT COUNT(*) as count FROM evidence WHERE event_id = ?
  `).get(eventId).count;

  const discoveryRatio = totalEvidenceCount > 0 ? discoveredCount / totalEvidenceCount : 0;
  const evidenceScore = Math.round(discoveryRatio * 20);

  // 3. Reasoning score (20%) - based on established deductions
  const deductionCount = db.prepare(`
    SELECT COUNT(*) as count FROM participant_deductions
    WHERE participant_id = ?
  `).get(participantId).count;

  const totalDeductions = db.prepare(`
    SELECT COUNT(*) as count FROM deductions WHERE event_id = ?
  `).get(eventId).count;

  const deductionRatio = totalDeductions > 0 ? deductionCount / totalDeductions : 0;
  const reasoningScore = Math.round(deductionRatio * 20);

  // 4. Culprit identification (15%) - correct culprit
  let culpritScore = 0;
  if (accusedPerson && accusedPerson.toUpperCase().includes('NIKHIL')) {
    culpritScore = 15;
  } else if (accusedPerson) {
    // Partial credit for getting close
    const suspectConfidence = JSON.parse(participant.guilt || '{}');
    if (accusedPerson.toUpperCase().includes('RAGHAV')) {
      culpritScore = 5; // Close but wrong
    }
  }

  // 5. Time bonus (10%) - based on remaining time
  const now = new Date();
  const endTime = new Date(event.end_time);
  const totalTime = (new Date(event.end_time) - new Date(event.start_time)) / 1000; // in seconds
  const timeUsed = (now - new Date(event.start_time)) / 1000;
  const timeRemaining = Math.max(0, (endTime - now) / 1000);

  // More points for completing earlier
  const timeBonus = totalTime > 0 ? Math.max(0, Math.round((timeRemaining / totalTime) * 10)) : 10;

  const totalScore = innocenceScore + evidenceScore + reasoningScore + culpritScore + timeBonus;

  return {
    innocenceScore,
    evidenceDiscoveryScore: evidenceScore,
    reasoningScore,
    culpritIdentificationScore: culpritScore,
    timeBonusScore: timeBonus,
    totalScore: Math.min(100, totalScore)
  };
}

export function validateDefense(participantId) {
  const db = getDb();

  const participant = db.prepare(`
    SELECT * FROM participants WHERE id = ?
  `).get(participantId);

  const submission = db.prepare(`
    SELECT * FROM final_submissions WHERE participant_id = ?
  `).get(participantId);

  if (!submission) {
    return { valid: false, message: 'No submission found' };
  }

  // Check guilt is below threshold
  if (participant.guilt > 40) {
    return {
      valid: false,
      message: `Your guilt level is still ${participant.guilt}%. You need stronger evidence of innocence.`
    };
  }

  // Check if culprit identification is reasonable
  if (!submission.accused_person) {
    return { valid: false, message: 'You must identify the responsible person' };
  }

  return { valid: true };
}
