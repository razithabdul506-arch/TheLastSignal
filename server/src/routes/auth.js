import express from 'express';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import { getDb } from '../database/init.js';
import { createToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const db = getDb();
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuid();

    db.prepare(`
      INSERT INTO users (id, email, name, password_hash)
      VALUES (?, ?, ?, ?)
    `).run(userId, email, name, passwordHash);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const token = createToken(user);

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, is_admin: user.is_admin } });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createToken(user);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, is_admin: user.is_admin } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
