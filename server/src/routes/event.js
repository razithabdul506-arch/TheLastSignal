import express from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../database/init.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get active event
router.get('/active', (req, res) => {
  const db = getDb();
  const event = db.prepare(`
    SELECT * FROM events
    WHERE status = 'active'
    ORDER BY start_time DESC
    LIMIT 1
  `).get();

  if (!event) {
    return res.status(404).json({ error: 'No active event' });
  }

  res.json(event);
});

// Register for event
router.post('/register', authMiddleware, (req, res) => {
  const { event_id, participant_name } = req.body;

  if (!event_id || !participant_name) {
    return res.status(400).json({ error: 'Missing event_id or participant_name' });
  }

  try {
    const db = getDb();

    // Check event exists and is active
    const event = db.prepare('SELECT * FROM events WHERE id = ? AND status = ?').get(event_id, 'active');
    if (!event) {
      return res.status(404).json({ error: 'Event not found or not active' });
    }

    // Check if already registered
    const existing = db.prepare(`
      SELECT * FROM participants
      WHERE event_id = ? AND user_id = ?
    `).get(event_id, req.user.id);

    if (existing) {
      return res.json(existing);
    }

    // Create participant record
    const participantId = uuid();
    db.prepare(`
      INSERT INTO participants (id, event_id, user_id, participant_name)
      VALUES (?, ?, ?, ?)
    `).run(participantId, event_id, req.user.id, participant_name);

    // Initialize case state
    const caseStateId = uuid();
    db.prepare(`
      INSERT INTO case_states (id, participant_id, guilt, suspect_confidence)
      VALUES (?, ?, 100, ?)
    `).run(
      caseStateId,
      participantId,
      JSON.stringify({
        participant: 100,
        ananya: 20,
        rahul: 15,
        raghav: 25,
        nikhil: 10
      })
    );

    const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(participantId);
    res.json(participant);
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get participant status
router.get('/status', authMiddleware, (req, res) => {
  const db = getDb();

  // Get active event
  const event = db.prepare(`
    SELECT * FROM events
    WHERE status = 'active'
    ORDER BY start_time DESC
    LIMIT 1
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

  // Calculate time remaining
  const now = new Date();
  const endTime = new Date(event.end_time);
  const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));

  // Get case state
  const caseState = db.prepare(`
    SELECT * FROM case_states WHERE participant_id = ?
  `).get(participant.id);

  // Get discovered evidence count
  const discoveredCount = db.prepare(`
    SELECT COUNT(*) as count FROM evidence_discoveries
    WHERE participant_id = ?
  `).get(participant.id).count;

  res.json({
    ...participant,
    event,
    timeRemaining,
    caseState,
    discoveredEvidenceCount: discoveredCount
  });
});

// Admin: Create event
router.post('/', authMiddleware, (req, res) => {
  const { title, description, start_time, end_time } = req.body;

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (!user || !user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const eventId = uuid();
    db.prepare(`
      INSERT INTO events (id, title, description, start_time, end_time, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(eventId, title, description, start_time, end_time, req.user.id);

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
    res.json(event);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Admin: Start event
router.put('/:id/start', authMiddleware, (req, res) => {
  const { id } = req.params;

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (!user || !user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    // Set all other events to completed
    db.prepare(`
      UPDATE events SET status = 'completed'
      WHERE status = 'active'
    `).run();

    // Update this event to active
    db.prepare(`
      UPDATE events SET status = 'active', start_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    res.json(event);
  } catch (err) {
    console.error('Error starting event:', err);
    res.status(500).json({ error: 'Failed to start event' });
  }
});

// Admin: End event
router.put('/:id/end', authMiddleware, (req, res) => {
  const { id } = req.params;

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (!user || !user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    db.prepare(`
      UPDATE events SET status = 'completed', end_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    res.json(event);
  } catch (err) {
    console.error('Error ending event:', err);
    res.status(500).json({ error: 'Failed to end event' });
  }
});

export default router;
