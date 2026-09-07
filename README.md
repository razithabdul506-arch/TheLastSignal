# MERCY — THE LAST HEARTBEAT

A full-stack web application for an interactive murder investigation game. Participants must prove their innocence in the death of their wife, Meera Krishnan, over the course of one hour.

## Project Overview

**MERCY** is a one-hour competitive investigation event where:
- Participants are initially the primary suspect in a murder case
- They must discover evidence, defend themselves, and identify the actual culprit (Nikhil Varma)
- An AI investigator evaluates their arguments and guides their investigation
- Multiple scoring dimensions reward logical reasoning, not just guessing

## Architecture

- **Backend**: Node.js/Express with SQLite database
- **Frontend**: React with Vite bundler
- **AI Integration**: Abstract provider supporting OpenAI and Gemini APIs
- **Database**: better-sqlite3 for server-side persistence

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install all dependencies
npm install

# Or use the workspace installer
npm run install-all
```

### Seeding the Database

Before running the application, seed the database with the complete MERCY case:

```bash
cd server
npm run seed
```

This creates:
- Admin user: `admin@mercy.local` / `admin123`
- Test user: `test@mercy.local` / `test123`
- Complete evidence set (47+ items)
- Predefined deductions (10+ logical conclusions)
- MERCY event scheduled for 9:00 AM - 10:00 AM

### Running Locally

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
# Server runs on http://localhost:3001
```

**Terminal 2 - Frontend Development:**
```bash
cd client
npm run dev
# Frontend runs on http://localhost:3000
```

Then open http://localhost:3000 in your browser.

## Configuration

### Backend (.env)

```env
PORT=3001
JWT_SECRET=your-secret-key

# AI Provider (none, openai, or gemini)
AI_PROVIDER=none

# OpenAI
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-4-turbo-preview

# Gemini
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-pro
```

## Core Features

### Evidence System
- 47+ evidence items covering:
  - Emergency calls and police reports
  - CCTV and digital logs
  - Medical records
  - Messages and phone records
  - Financial transactions
  - Shipping/warehouse documentation
  - Research and device logs

### AI Investigation Assistant
- Natural language chat interface
- Defense evaluation with structured reasoning
- Guilt calculation based on deductions
- Prevents score farming through deduction tracking
- Fallback responses when API unavailable

### Guilt & Scoring System

**Guilt (0-100)**
- Starts at 100%
- Decreases as participant establishes valid defenses
- Tracked per participant

**Final Score (0-100)**
- Innocence/Defense: 35%
- Evidence Discovery: 20%
- Reasoning/Causality: 20%
- Culprit Identification: 15%
- Time Bonus: 10%

### Event Lifecycle
- Registration phase (open until event starts)
- Investigation phase (60 minutes)
- Final submission
- Leaderboard display

## Database Schema

Key tables:
- `users` - Participant accounts
- `events` - Investigation events
- `participants` - Per-participant data
- `evidence` - Case evidence items
- `evidence_discoveries` - Tracks which participant discovered which evidence
- `deductions` - Predefined logical conclusions
- `participant_deductions` - Tracks unlocked deductions
- `ai_conversations` - Chat history
- `case_states` - Participant investigation state
- `final_submissions` - Final answers
- `scores` - Calculated scores

## Canonical Story Summary

**The Chain of Causality:**

1. **Raghav's Criminal Operation**: Raghav diverts high-value electronic shipments from Meridian Ocean Logistics

2. **Meera's Investigation**: Meera discovers the missing shipments and begins investigating

3. **Raghav's Response**: Raghav attempts to silence Meera and blackmail her

4. **Family Conflict**: Ananya (daughter) discovers Meera and Raghav's affair, becomes angry

5. **Planned Scare**: Ananya and Rahul plan a non-lethal scare to teach Meera a lesson

6. **Digital Research**: Rahul searches for medical device information, finds Nikhil's research

7. **Nikhil's Hijacking**: Nikhil realizes Meera is the target, sees an opportunity

8. **Escalation**: Nikhil sabotages the planned scare, changing it from fake to fatal

9. **The Event**: Nikhil remotely modifies Meera's cardiac implant settings, causing her death

10. **Investigation**: The husband is initially blamed but is innocent; Nikhil's involvement is concealed

## Key Files

### Backend
- `server/src/index.js` - Express server setup
- `server/src/database/init.js` - Database schema
- `server/src/routes/` - API endpoints
- `server/src/services/` - Business logic (AI, scoring, case context)
- `server/src/scripts/seed.js` - Database seeding

### Frontend
- `client/src/App.jsx` - Main app component
- `client/src/pages/` - Page components (Auth, Registration, Investigation, etc.)
- `client/src/components/` - Reusable components (Timer, Chat, Evidence, etc.)
- `client/src/styles/` - CSS styling
- `client/src/api.js` - API client

## Testing

### Manual Testing Scenarios

**Basic Investigation:**
1. Register with test account
2. View initial evidence (5 items)
3. Ask AI for guidance
4. Gradually discover connected evidence
5. Submit final answer

**Multiple Simultaneous Participants:**
```bash
# Create multiple test users in database
# Run investigation in separate browsers
# Each maintains independent investigation state
# Scores calculated independently
```

**Event Management:**
1. Admin login with `admin@mercy.local`
2. View event overview
3. Monitor participant progress
4. See AI interaction counts
5. View final scores and submissions

### Security Checks

- ✓ Server-authoritative timer (no client-side manipulation)
- ✓ Server-side guilt calculation (no score farming)
- ✓ Evidence access control (can only see discovered evidence)
- ✓ Deduction tracking (awards only once)
- ✓ Final submission validation (only one allowed)
- ✓ Admin access control (requires is_admin flag)

## Limitations & Future Enhancements

### Current Limitations
- AI provider defaults to dummy evaluator without API keys configured
- No real-time participant notifications
- No team collaboration mode
- No custom event creation UI (admin must use seed script)

### Potential Enhancements
- WebSocket for real-time events/leaderboard updates
- Custom event creation interface for admins
- Participant hints system with scoring penalties
- Advanced analytics and investigation flow visualization
- Mobile app version
- Multiplayer deduction phase at event end

## Deployment

### Production Build

```bash
# Build both frontend and backend
npm run build

# Start production server
NODE_ENV=production npm start --workspace server
```

### Docker (Optional)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY server/ ./server/
COPY client/ ./client/

RUN npm install
RUN npm run seed --workspace server

EXPOSE 3001 3000

CMD ["npm", "start"]
```

## Support

For questions or issues:
1. Check the `.env.example` for configuration requirements
2. Ensure database is seeded with `npm run seed`
3. Verify both server and client are running
4. Check browser console and server logs for errors

## Attribution

Built as a complete full-stack implementation of the MERCY investigation game concept.

---

**Start your investigation at:** http://localhost:3000
