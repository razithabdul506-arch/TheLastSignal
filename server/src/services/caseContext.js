import { getDb } from '../database/init.js';

export function getCaseContext(participantId) {
  const db = getDb();

  // Get participant
  const participant = db.prepare(`
    SELECT * FROM participants WHERE id = ?
  `).get(participantId);

  if (!participant) {
    return null;
  }

  // Get event
  const event = db.prepare(`
    SELECT * FROM events WHERE id = ?
  `).get(participant.event_id);

  // Get discovered evidence
  const discoveredEvidence = db.prepare(`
    SELECT e.* FROM evidence e
    JOIN evidence_discoveries ed ON e.id = ed.evidence_id
    WHERE ed.participant_id = ?
    ORDER BY e.created_at ASC
  `).all(participantId);

  // Get established deductions
  const establishedDeductions = db.prepare(`
    SELECT d.* FROM deductions d
    JOIN participant_deductions pd ON d.id = pd.deduction_id
    WHERE pd.participant_id = ?
    ORDER BY pd.unlocked_at ASC
  `).all(participantId);

  // Get case state
  const caseState = db.prepare(`
    SELECT * FROM case_states WHERE participant_id = ?
  `).get(participantId);

  return {
    participantId,
    participantName: participant.participant_name,
    guilt: participant.guilt,
    discoveredEvidence,
    establishedDeductions,
    suspectConfidence: caseState ? JSON.parse(caseState.suspect_confidence) : {},
    investigationPhase: caseState?.investigation_phase || 'accusation',
    eventEndTime: event?.end_time
  };
}

export function getRelevantEvidence(participantId, topic) {
  const db = getDb();

  const discovered = db.prepare(`
    SELECT e.* FROM evidence e
    JOIN evidence_discoveries ed ON e.id = ed.evidence_id
    WHERE ed.participant_id = ? AND (
      e.title LIKE ? OR
      e.description LIKE ? OR
      e.related_characters LIKE ? OR
      e.category LIKE ?
    )
    ORDER BY e.created_at ASC
  `).all(participantId, `%${topic}%`, `%${topic}%`, `%${topic}%`, `%${topic}%`);

  return discovered;
}
