import express from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../database/init.js';
import { calculateFinalScore } from '../services/scoring.js';

const router = express.Router();

// Submit final answer
router.post('/submit-final', async (req, res) => {
  const { defense_text, accused_person, causal_chain } = req.body;

  if (!defense_text || !accused_person || !causal_chain) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const db = getDb();

    const event = db.prepare(`
      SELECT * FROM events WHERE status = 'active'
      ORDER BY start_time DESC LIMIT 1
    `).get();

    if (!event) {
      return res.status(404).json({ error: 'No active event' });
    }

    const participant = db.prepare(`
      SELECT * FROM participants
      WHERE event_id = ? AND user_id = ?
    `).get(event.id, req.user.id);

    if (!participant) {
      return res.status(404).json({ error: 'Not registered for this event' });
    }

    // Check if already submitted
    const existing = db.prepare(`
      SELECT * FROM final_submissions WHERE participant_id = ?
    `).get(participant.id);

    if (existing) {
      return res.status(400).json({ error: 'Final answer already submitted' });
    }

    // Save submission
    const submissionId = uuid();
    db.prepare(`
      INSERT INTO final_submissions (id, participant_id, defense_text, accused_person, causal_chain)
      VALUES (?, ?, ?, ?, ?)
    `).run(submissionId, participant.id, defense_text, accused_person, causal_chain);

    // Calculate score
    const score = calculateFinalScore(participant.id, accused_person, event.id);

    // Save score
    const scoreId = uuid();
    db.prepare(`
      INSERT INTO scores (id, participant_id, innocence_score, evidence_discovery_score,
        reasoning_score, culprit_identification_score, time_bonus_score, total_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      scoreId,
      participant.id,
      score.innocenceScore,
      score.evidenceDiscoveryScore,
      score.reasoningScore,
      score.culpritIdentificationScore,
      score.timeBonusScore,
      score.totalScore
    );

    // Update participant
    db.prepare(`
      UPDATE participants SET final_submitted = 1, final_score = ?
      WHERE id = ?
    `).run(score.totalScore, participant.id);

    res.json({
      submission: {
        defense_text,
        accused_person,
        causal_chain
      },
      score: {
        innocenceScore: score.innocenceScore,
        evidenceDiscoveryScore: score.evidenceDiscoveryScore,
        reasoningScore: score.reasoningScore,
        culpritIdentificationScore: score.culpritIdentificationScore,
        timeBonusScore: score.timeBonusScore,
        totalScore: score.totalScore
      }
    });
  } catch (err) {
    console.error('Score submission error:', err);
    res.status(500).json({ error: 'Failed to submit final answer' });
  }
});

// Get current score
router.get('/current', (req, res) => {
  const db = getDb();

  const event = db.prepare(`
    SELECT * FROM events WHERE status = 'active'
    ORDER BY start_time DESC LIMIT 1
  `).get();

  if (!event) {
    return res.status(404).json({ error: 'No active event' });
  }

  const participant = db.prepare(`
    SELECT * FROM participants
    WHERE event_id = ? AND user_id = ?
  `).get(event.id, req.user.id);

  if (!participant) {
    return res.status(404).json({ error: 'Not registered for this event' });
  }

  const score = db.prepare(`
    SELECT * FROM scores WHERE participant_id = ?
  `).get(participant.id);

  res.json({
    guilt: participant.guilt,
    finalScore: score?.total_score || null,
    submitted: participant.final_submitted
  });
});

// Get leaderboard
router.get('/leaderboard', (req, res) => {
  const db = getDb();

  const event = db.prepare(`
    SELECT * FROM events WHERE status = 'active' OR status = 'completed'
    ORDER BY start_time DESC LIMIT 1
  `).get();

  if (!event) {
    return res.status(404).json({ error: 'No event found' });
  }

  const results = db.prepare(`
    SELECT p.id, u.name, p.participant_name, s.total_score, p.final_submitted
    FROM participants p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN scores s ON p.id = s.participant_id
    WHERE p.event_id = ?
    ORDER BY s.total_score DESC NULLS LAST, p.created_at ASC
  `).all(event.id);

  res.json({
    event: event.id,
    leaderboard: results.map((r, idx) => ({
      rank: idx + 1,
      name: r.participant_name,
      score: r.total_score || 0,
      submitted: r.final_submitted
    }))
  });
});

export default router;
