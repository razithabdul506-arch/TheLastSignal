import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../data/mercy.db');

let db = null;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initializeDatabase() {
  const database = getDb();

  // Users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Events table
  database.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      status TEXT DEFAULT 'scheduled',
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Participants table
  database.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      participant_name TEXT NOT NULL,
      guilt INTEGER DEFAULT 100,
      status TEXT DEFAULT 'investigating',
      final_submitted INTEGER DEFAULT 0,
      final_score INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE (event_id, user_id)
    )
  `);

  // Sessions table
  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      participant_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (participant_id) REFERENCES participants(id)
    )
  `);

  // Evidence table
  database.exec(`
    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      file_path TEXT,
      content TEXT,
      timestamp TEXT,
      related_characters TEXT,
      discovery_condition TEXT,
      hidden INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);

  // Evidence discoveries table (tracks which participant discovered which evidence)
  database.exec(`
    CREATE TABLE IF NOT EXISTS evidence_discoveries (
      id TEXT PRIMARY KEY,
      participant_id TEXT NOT NULL,
      evidence_id TEXT NOT NULL,
      discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (participant_id) REFERENCES participants(id),
      FOREIGN KEY (evidence_id) REFERENCES evidence(id),
      UNIQUE (participant_id, evidence_id)
    )
  `);

  // Deductions table (predefined logical deductions)
  database.exec(`
    CREATE TABLE IF NOT EXISTS deductions (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      evidence_required TEXT,
      guilt_impact INTEGER,
      suspect_impacts TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);

  // Participant deductions (tracks which deductions participant has unlocked)
  database.exec(`
    CREATE TABLE IF NOT EXISTS participant_deductions (
      id TEXT PRIMARY KEY,
      participant_id TEXT NOT NULL,
      deduction_id TEXT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (participant_id) REFERENCES participants(id),
      FOREIGN KEY (deduction_id) REFERENCES deductions(id),
      UNIQUE (participant_id, deduction_id)
    )
  `);

  // AI conversations table
  database.exec(`
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      participant_id TEXT NOT NULL,
      message TEXT NOT NULL,
      role TEXT NOT NULL,
      evaluation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (participant_id) REFERENCES participants(id)
    )
  `);

  // Case state table (stores investigation state for each participant)
  database.exec(`
    CREATE TABLE IF NOT EXISTS case_states (
      id TEXT PRIMARY KEY,
      participant_id TEXT NOT NULL,
      guilt INTEGER DEFAULT 100,
      suspect_confidence TEXT,
      investigation_phase TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (participant_id) REFERENCES participants(id),
      UNIQUE (participant_id)
    )
  `);

  // Final submissions table
  database.exec(`
    CREATE TABLE IF NOT EXISTS final_submissions (
      id TEXT PRIMARY KEY,
      participant_id TEXT NOT NULL,
      defense_text TEXT NOT NULL,
      accused_person TEXT NOT NULL,
      causal_chain TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (participant_id) REFERENCES participants(id),
      UNIQUE (participant_id)
    )
  `);

  // Scores table
  database.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id TEXT PRIMARY KEY,
      participant_id TEXT NOT NULL,
      innocence_score INTEGER,
      evidence_discovery_score INTEGER,
      reasoning_score INTEGER,
      culprit_identification_score INTEGER,
      time_bonus_score INTEGER,
      total_score INTEGER,
      calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (participant_id) REFERENCES participants(id),
      UNIQUE (participant_id)
    )
  `);

  // Audit log table
  database.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      participant_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (participant_id) REFERENCES participants(id)
    )
  `);

  console.log('Database initialized successfully');
}
