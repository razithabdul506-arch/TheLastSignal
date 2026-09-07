import express from 'express';
import { getDb } from '../database/init.js';
import { adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// List events
router.get('/events', adminMiddleware, (req, res) => {
  const db = getDb();
  const events = db.prepare(`
    SELECT * FROM events ORDER BY created_at DESC
  `).all();
  res.json(events);
});

// Get event details
router.get('/events/:id', adminMiddleware, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const participantCount = db.prepare(`
    SELECT COUNT(*) as count FROM participants WHERE event_id = ?
  `).get(id).count;

  const completedCount = db.prepare(`
    SELECT COUNT(*) as count FROM participants
    WHERE event_id = ? AND final_submitted = 1
  `).get(id).count;

  const avgGuilt = db.prepare(`
    SELECT AVG(guilt) as avg FROM participants WHERE event_id = ?
  `).get(id).avg;

  const avgScore = db.prepare(`
    SELECT AVG(s.total_score) as avg FROM scores s
    JOIN participants p ON s.participant_id = p.id
    WHERE p.event_id = ?
  `).get(id).avg;

  res.json({
    ...event,
    stats: {
      participantCount,
      completedCount,
      avgGuilt: Math.round(avgGuilt || 0),
      avgScore: Math.round(avgScore || 0)
    }
  });
});

// List participants
router.get('/events/:id/participants', adminMiddleware, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const participants = db.prepare(`
    SELECT p.*, u.email, u.name,
           COALESCE(s.total_score, 0) as final_score
    FROM participants p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN scores s ON p.id = s.participant_id
    WHERE p.event_id = ?
    ORDER BY s.total_score DESC NULLS LAST
  `).all(id);

  res.json(participants);
});

// Get participant details
router.get('/participants/:id', adminMiddleware, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const participant = db.prepare(`
    SELECT p.*, u.email, u.name FROM participants p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(id);

  if (!participant) {
    return res.status(404).json({ error: 'Participant not found' });
  }

  const caseState = db.prepare(`
    SELECT * FROM case_states WHERE participant_id = ?
  `).get(id);

  const score = db.prepare(`
    SELECT * FROM scores WHERE participant_id = ?
  `).get(id);

  const discoveries = db.prepare(`
    SELECT COUNT(*) as count FROM evidence_discoveries
    WHERE participant_id = ?
  `).get(id).count;

  const submission = db.prepare(`
    SELECT * FROM final_submissions WHERE participant_id = ?
  `).get(id);

  const messages = db.prepare(`
    SELECT * FROM ai_conversations WHERE participant_id = ?
  `).all(id);

  res.json({
    ...participant,
    caseState,
    score,
    discoveredEvidenceCount: discoveries,
    messageCount: messages.length,
    finalSubmission: submission
  });
});

// Event overview
router.get('/events/:id/overview', adminMiddleware, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM participants WHERE event_id = ?
  `).get(id).count;

  const completed = db.prepare(`
    SELECT COUNT(*) as count FROM participants
    WHERE event_id = ? AND final_submitted = 1
  `).get(id).count;

  const investigating = total - completed;

  const avgGuilt = db.prepare(`
    SELECT AVG(guilt) as avg FROM participants WHERE event_id = ?
  `).get(id).avg;

  const avgScore = db.prepare(`
    SELECT AVG(s.total_score) as avg FROM scores s
    JOIN participants p ON s.participant_id = p.id
    WHERE p.event_id = ?
  `).get(id).avg;

  const messageCount = db.prepare(`
    SELECT COUNT(*) as count FROM ai_conversations ac
    JOIN participants p ON ac.participant_id = p.id
    WHERE p.event_id = ? AND ac.role = 'user'
  `).get(id).count;

  res.json({
    event,
    stats: {
      totalParticipants: total,
      completed,
      investigating,
      averageGuilt: Math.round(avgGuilt || 0),
      averageScore: Math.round(avgScore || 0),
      aiMessagesTotal: messageCount
    }
  });
});

// Reset test participant
router.delete('/participants/:id', adminMiddleware, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(id);
  if (!participant) {
    return res.status(404).json({ error: 'Participant not found' });
  }

  try {
    db.prepare('DELETE FROM evidence_discoveries WHERE participant_id = ?').run(id);
    db.prepare('DELETE FROM participant_deductions WHERE participant_id = ?').run(id);
    db.prepare('DELETE FROM ai_conversations WHERE participant_id = ?').run(id);
    db.prepare('DELETE FROM case_states WHERE participant_id = ?').run(id);
    db.prepare('DELETE FROM final_submissions WHERE participant_id = ?').run(id);
    db.prepare('DELETE FROM scores WHERE participant_id = ?').run(id);
    db.prepare('DELETE FROM participants WHERE id = ?').run(id);

    res.json({ message: 'Participant deleted' });
  } catch (err) {
    console.error('Error deleting participant:', err);
    res.status(500).json({ error: 'Failed to delete participant' });
  }
});

export default router;
