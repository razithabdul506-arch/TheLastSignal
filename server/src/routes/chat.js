import express from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../database/init.js';
import { evaluateDefense } from '../services/aiEvaluator.js';
import { getCaseContext } from '../services/caseContext.js';

const router = express.Router();

// Send message to AI investigator
router.post('/message', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const db = getDb();

    // Get active event
    const event = db.prepare(`
      SELECT * FROM events WHERE status = 'active'
      ORDER BY start_time DESC LIMIT 1
    `).get();

    if (!event) {
      return res.status(404).json({ error: 'No active event' });
    }

    // Check if event has ended
    const now = new Date();
    const endTime = new Date(event.end_time);
    if (now >= endTime) {
      return res.status(403).json({ error: 'Investigation period has ended' });
    }

    // Get participant
    const participant = db.prepare(`
      SELECT * FROM participants
      WHERE event_id = ? AND user_id = ?
    `).get(event.id, req.user.id);

    if (!participant) {
      return res.status(404).json({ error: 'Not registered for this event' });
    }

    // Get case context
    const caseContext = getCaseContext(participant.id);

    // Evaluate the message
    const evaluation = await evaluateDefense(message, caseContext);

    // Save conversation
    const conversationId = uuid();
    db.prepare(`
      INSERT INTO ai_conversations (id, participant_id, message, role, evaluation)
      VALUES (?, ?, ?, ?, ?)
    `).run(conversationId, participant.id, message, 'user', JSON.stringify(evaluation));

    // If deduction should be awarded, update guilt
    if (evaluation.deductionCandidates && evaluation.deductionCandidates.length > 0) {
      for (const deductionId of evaluation.deductionCandidates) {
        const deduction = db.prepare(`
          SELECT * FROM deductions WHERE id = ? AND event_id = ?
        `).get(deductionId, event.id);

        if (deduction) {
          // Check if already awarded
          const existing = db.prepare(`
            SELECT * FROM participant_deductions
            WHERE participant_id = ? AND deduction_id = ?
          `).get(participant.id, deductionId);

          if (!existing) {
            const deductionRecordId = uuid();
            db.prepare(`
              INSERT INTO participant_deductions (id, participant_id, deduction_id)
              VALUES (?, ?, ?)
            `).run(deductionRecordId, participant.id, deductionId);

            // Update guilt
            const newGuilt = Math.max(0, participant.guilt + deduction.guilt_impact);
            db.prepare(`
              UPDATE participants SET guilt = ? WHERE id = ?
            `).run(newGuilt, participant.id);

            // Update case state
            db.prepare(`
              UPDATE case_states SET guilt = ? WHERE participant_id = ?
            `).run(newGuilt, participant.id);
          }
        }
      }
    }

    // Save AI response
    const aiResponseId = uuid();
    db.prepare(`
      INSERT INTO ai_conversations (id, participant_id, message, role)
      VALUES (?, ?, ?, ?)
    `).run(aiResponseId, participant.id, evaluation.response, 'assistant');

    // Get updated participant
    const updatedParticipant = db.prepare('SELECT * FROM participants WHERE id = ?').get(participant.id);

    res.json({
      response: evaluation.response,
      evaluation: {
        strength: evaluation.strength,
        supportedEvidence: evaluation.supportedEvidence || [],
        deductionCandidates: evaluation.deductionCandidates || []
      },
      updatedGuilt: updatedParticipant.guilt
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get conversation history
router.get('/history', (req, res) => {
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

  const conversations = db.prepare(`
    SELECT * FROM ai_conversations
    WHERE participant_id = ?
    ORDER BY created_at ASC
  `).all(participant.id);

  res.json(conversations);
});

export default router;
