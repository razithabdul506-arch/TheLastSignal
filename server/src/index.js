import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/init.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/event.js';
import evidenceRoutes from './routes/evidence.js';
import chatRoutes from './routes/chat.js';
import scoreRoutes from './routes/score.js';
import adminRoutes from './routes/admin.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initializeDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/evidence', authMiddleware, evidenceRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/score', authMiddleware, scoreRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`MERCY server running on http://localhost:${PORT}`);
});
