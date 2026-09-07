import express from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../database/init.js';

const router = express.Router();

// Get discovered evidence
router.get('/', (req, res) => {
  const db = getDb();

  // Get active event
  const event = db.prepare(`
    SELECT * FROM events WHERE status = 'active'
    ORDER BY start_time DESC LIMIT 1
  `).get();

  if (!event) {
    return res.status(404).json({ error: 'No active event' });
  }

  // Get participant
  const participant = db.prepare(`
    SELECT * FROM participants
    WHERE event_id = ? AND user_id = ?
  `).get(event.id, req.user.id);

  if (!participant) {
    return res.status(404).json({ error: 'Not registered for this event' });
  }

  // Get all discovered evidence
  const discovered = db.prepare(`
    SELECT e.* FROM evidence e
    JOIN evidence_discoveries ed ON e.id = ed.evidence_id
    WHERE ed.participant_id = ?
    ORDER BY e.created_at ASC
  `).all(participant.id);

  res.json(discovered);
});

// Get specific evidence
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();

  // Get active event
  const event = db.prepare(`
    SELECT * FROM events WHERE status = 'active'
    ORDER BY start_time DESC LIMIT 1
  `).get();

  if (!event) {
    return res.status(404).json({ error: 'No active event' });
  }

  // Get participant
  const participant = db.prepare(`
    SELECT * FROM participants
    WHERE event_id = ? AND user_id = ?
  `).get(event.id, req.user.id);

  if (!participant) {
    return res.status(404).json({ error: 'Not registered for this event' });
  }

  // Get evidence
  const evidence = db.prepare('SELECT * FROM evidence WHERE id = ? AND event_id = ?').get(id, event.id);

  if (!evidence) {
    return res.status(404).json({ error: 'Evidence not found' });
  }

  // Check if discovered
  const discovered = db.prepare(`
    SELECT * FROM evidence_discoveries
    WHERE participant_id = ? AND evidence_id = ?
  `).get(participant.id, id);

  if (!discovered) {
    return res.status(403).json({ error: 'Evidence not discovered yet' });
  }

  res.json(evidence);
});

// Unlock evidence (called when discovering new evidence)
router.post('/:id/discover', (req, res) => {
  const { id } = req.params;
  const db = getDb();

  // Get active event
  const event = db.prepare(`
    SELECT * FROM events WHERE status = 'active'
    ORDER BY start_time DESC LIMIT 1
  `).get();

  if (!event) {
    return res.status(404).json({ error: 'No active event' });
  }

  // Get participant
  const participant = db.prepare(`
    SELECT * FROM participants
    WHERE event_id = ? AND user_id = ?
  `).get(event.id, req.user.id);

  if (!participant) {
    return res.status(404).json({ error: 'Not registered for this event' });
  }

  // Get evidence
  const evidence = db.prepare('SELECT * FROM evidence WHERE id = ? AND event_id = ?').get(id, event.id);

  if (!evidence) {
    return res.status(404).json({ error: 'Evidence not found' });
  }

  // Check if already discovered
  const existing = db.prepare(`
    SELECT * FROM evidence_discoveries
    WHERE participant_id = ? AND evidence_id = ?
  `).get(participant.id, id);

  if (existing) {
    return res.json(evidence);
  }

  try {
    const discoveryId = uuid();
    db.prepare(`
      INSERT INTO evidence_discoveries (id, participant_id, evidence_id)
      VALUES (?, ?, ?)
    `).run(discoveryId, participant.id, id);

    res.json(evidence);
  } catch (err) {
    console.error('Error discovering evidence:', err);
    res.status(500).json({ error: 'Failed to discover evidence' });
  }
});

// Get timeline events
router.get('/timeline/events', (req, res) => {
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

  // Get discovered evidence with timestamps
  const timelineEvents = db.prepare(`
    SELECT e.id, e.title, e.timestamp, e.category
    FROM evidence e
    JOIN evidence_discoveries ed ON e.id = ed.evidence_id
    WHERE ed.participant_id = ? AND e.timestamp IS NOT NULL
    ORDER BY e.timestamp ASC
  `).all(participant.id);

  res.json(timelineEvents);
});

export default router;
