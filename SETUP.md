# MERCY Setup Guide

Complete guide to building and running the MERCY investigation game locally.

## Requirements

- **Node.js**: 18 or later
- **npm**: 8 or later
- **Git**: for version control

## Installation Steps

### 1. Clone and Setup

```bash
# Navigate to project directory (already done)
cd /home/user/TheLastSignal

# Install all dependencies
npm install

# Create .env files from templates
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 2. Seed the Database

The database must be seeded with the complete MERCY case before running:

```bash
cd server
npm run seed
```

**Output will show:**
```
✓ Event created
✓ Deductions created
✓ 47 evidence records created
✓ Test participant created with initial evidence

Test Credentials:
  Email: test@mercy.local
  Password: test123

Admin Credentials:
  Email: admin@mercy.local
  Password: admin123
```

### 3. Run Development Servers

**Start Backend (Terminal 1):**
```bash
cd server
npm run dev
```

Expected output:
```
MERCY server running on http://localhost:3001
```

**Start Frontend (Terminal 2):**
```bash
cd client
npm run dev
```

Expected output:
```
VITE v5.0.0 ready in XXX ms

➜  Local:   http://localhost:3000/
```

### 4. Access the Application

Open browser to: **http://localhost:3000**

## First-Time Testing

### Test as Participant

1. **Login Page**: Click "Don't have an account? Register"
2. **Register**: 
   - Email: `test-participant@mercy.local`
   - Name: `Your Name`
   - Password: `test123`
3. **Enter Investigation**: 
   - Name will become your character name
   - You'll be "Husband of Meera Krishnan"
   - You start as the PRIMARY SUSPECT
4. **Investigation**: 
   - View initial evidence (CCTV, police report, medical records)
   - Chat with AI investigator
   - Ask questions to gather more evidence
   - Work to reduce your guilt level
   - Submit final answer before time runs out

### Test as Admin

1. **Login Page**: Click "Admin"
2. **Login**:
   - Email: `admin@mercy.local`
   - Password: `admin123`
3. **Admin Panel**:
   - View active event
   - See all participants
   - Monitor guilt levels
   - Check AI interaction counts
   - View final scores when complete

## Testing Multiple Participants

To simulate a real event with multiple participants:

```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev

# Open multiple browser windows/tabs:
# - Window 1: http://localhost:3000 (Participant 1)
# - Window 2: http://localhost:3000 (Participant 2)
# - Window 3: http://localhost:3000 in Incognito (Participant 3)
# - etc.

# Each gets their own investigation state
# Scores calculated independently
```

## Configuration

### Backend Configuration

Edit `server/.env`:

```env
PORT=3001
JWT_SECRET=change-this-in-production

# No AI provider (uses dummy evaluator)
AI_PROVIDER=none

# Or integrate OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

# Or integrate Gemini
AI_PROVIDER=gemini
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-pro
```

### Frontend Configuration

Edit `client/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

For production:
```env
VITE_API_URL=https://api.mercy-app.com/api
```

## Database

The SQLite database is stored at: `server/data/mercy.db`

To reset the database:

```bash
cd server
rm data/mercy.db
npm run seed
```

## Troubleshooting

### Port Already in Use

**Server (3001):**
```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Or change PORT in server/.env
PORT=3002
```

**Client (3000):**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

### CORS Errors

Ensure the server is running and accessible:
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Database Errors

If you see SQLite errors, try re-seeding:
```bash
cd server
rm data/mercy.db
npm run seed
```

### Module Not Found

If you see "MODULE_NOT_FOUND" errors:
```bash
# Install all dependencies
npm install

# Install workspace packages
npm install --workspace server
npm install --workspace client

# Try running again
npm run dev --workspace server
npm run dev --workspace client
```

## Project Structure

```
TheLastSignal/
├── package.json                (root workspace)
├── README.md                   (main documentation)
├── SETUP.md                    (this file)
│
├── server/                     (Node.js/Express backend)
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── index.js           (server entry)
│   │   ├── database/
│   │   │   └── init.js        (schema)
│   │   ├── routes/            (API endpoints)
│   │   ├── services/          (business logic)
│   │   ├── middleware/        (auth, error handling)
│   │   └── scripts/
│   │       └── seed.js        (database seeding)
│   └── data/
│       └── mercy.db           (SQLite database)
│
├── client/                     (React/Vite frontend)
│   ├── package.json
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx           (entry point)
│       ├── App.jsx            (root component)
│       ├── api.js             (API client)
│       ├── pages/             (page components)
│       ├── components/        (reusable components)
│       └── styles/            (CSS styling)
│
├── docker-compose.yml         (Docker orchestration)
├── Dockerfile.server          (Backend Docker image)
└── Dockerfile.client          (Frontend Docker image)
```

## Development Workflow

### Code Changes

**After editing backend code:**
- Dev server auto-restarts with `--watch`
- Restart manually if needed: `npm run dev --workspace server`

**After editing frontend code:**
- Dev server auto-refreshes
- No restart needed

### Adding New Evidence

Edit `server/src/scripts/seed.js` in the `evidence` array:

```javascript
const evidence = [
  // Add new item:
  {
    id: 'E048',
    title: 'New Evidence Title',
    description: 'Description',
    type: 'text',
    category: 'digital',
    timestamp: '20:30',
    content: 'Evidence content...',
    related: 'CHARACTER_NAME',
    discovery: 'always' // or 'condition_name'
  },
  // ... other evidence
];
```

Then re-seed:
```bash
npm run seed --workspace server
```

### Adding New Deductions

Edit the `deductions` array in `server/src/scripts/seed.js`:

```javascript
const deductions = [
  {
    id: 'D011',
    title: 'New deduction title',
    description: 'Explanation of the deduction',
    evidence: 'E001,E002',  // comma-separated required evidence
    guilt: -5  // guilt impact (negative = reduces guilt)
  },
  // ... other deductions
];
```

## Performance Notes

- **Database**: SQLite is suitable for up to ~1000 concurrent participants
- **AI API**: Set reasonable rate limits if using external APIs
- **Session Management**: Uses JWT tokens with 24-hour expiry
- **Memory**: Each participant investigation state stored server-side

## Security Reminders

- [ ] Change `JWT_SECRET` in production
- [ ] Use HTTPS in production
- [ ] Implement rate limiting for API
- [ ] Add CORS configuration for production domain
- [ ] Use environment variables for all secrets
- [ ] Enable database encryption if required
- [ ] Audit logs stored in `audit_logs` table

## Production Deployment

See README.md for deployment instructions.

---

For support or questions, check the main README.md or examine the source code in `server/src/` and `client/src/`.
