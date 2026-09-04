import { getDb, initializeDatabase } from '../database/init.js';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Starting database seed...');

  initializeDatabase();
  const db = getDb();

  // Clear existing data
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM final_submissions;
    DELETE FROM scores;
    DELETE FROM participant_deductions;
    DELETE FROM ai_conversations;
    DELETE FROM case_states;
    DELETE FROM evidence_discoveries;
    DELETE FROM evidence;
    DELETE FROM deductions;
    DELETE FROM sessions;
    DELETE FROM participants;
    DELETE FROM events;
    DELETE FROM users;
  `);

  // Create admin user
  const adminId = uuid();
  const adminPassword = await bcrypt.hash('admin123', 10);
  db.prepare(`
    INSERT INTO users (id, email, name, password_hash, is_admin)
    VALUES (?, ?, ?, ?, 1)
  `).run(adminId, 'admin@mercy.local', 'Admin', adminPassword);

  // Create test user
  const userId = uuid();
  const userPassword = await bcrypt.hash('test123', 10);
  db.prepare(`
    INSERT INTO users (id, email, name, password_hash)
    VALUES (?, ?, ?, ?)
  `).run(userId, 'test@mercy.local', 'Test User', userPassword);

  // Create event - MERCY: The Last Heartbeat
  const eventId = uuid();
  const now = new Date();
  const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
  const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);

  // If the time has passed today, use tomorrow
  if (endTime <= now) {
    startTime.setDate(startTime.getDate() + 1);
    endTime.setDate(endTime.getDate() + 1);
  }

  db.prepare(`
    INSERT INTO events (id, title, description, start_time, end_time, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    eventId,
    'MERCY — THE LAST HEARTBEAT',
    'A one-hour investigation event where you must prove your innocence in your wife\'s death.',
    startTime.toISOString(),
    endTime.toISOString(),
    'active',
    adminId
  );

  console.log('✓ Event created');

  // Create deductions (predefined logical conclusions)
  const deductions = [
    {
      id: 'D001',
      title: 'Left before fatal event',
      description: 'Timeline proves participant left the house before the fatal event occurred',
      evidence: 'E017,E020',
      guilt: -15
    },
    {
      id: 'D002',
      title: 'No device access',
      description: 'Participant had no technical access to device systems',
      evidence: 'E035',
      guilt: -10
    },
    {
      id: 'D003',
      title: 'Device origin external',
      description: 'The device interaction originated from external infrastructure',
      evidence: 'E038,E039',
      guilt: -10
    },
    {
      id: 'D004',
      title: 'Emergency call timeline',
      description: 'Emergency call was placed by family member, not participant',
      evidence: 'E021',
      guilt: -5
    },
    {
      id: 'D005',
      title: 'Ananya motive established',
      description: 'Ananya had motive related to family conflict',
      evidence: 'E025,E026',
      guilt: 0
    },
    {
      id: 'D006',
      title: 'Rahul technical connection',
      description: 'Rahul searched for device-related information',
      evidence: 'E028,E029',
      guilt: 0
    },
    {
      id: 'D007',
      title: 'Raghav criminal operation',
      description: 'Raghav involved in missing shipment theft operation',
      evidence: 'E040,E041,E042',
      guilt: 0
    },
    {
      id: 'D008',
      title: 'Nikhil infrastructure access',
      description: 'Nikhil has access to research environment infrastructure',
      evidence: 'E043,E044,E045',
      guilt: -15
    },
    {
      id: 'D009',
      title: 'Device event timestamp',
      description: 'Device event occurred at specific timestamp correlating with sabotage',
      evidence: 'E037',
      guilt: -10
    },
    {
      id: 'D010',
      title: 'Nikhil hijacked plan',
      description: 'Nikhil discovered and interfered with Ananya and Rahul\'s plan',
      evidence: 'E046,E047',
      guilt: -20
    }
  ];

  deductions.forEach(d => {
    db.prepare(`
      INSERT INTO deductions (id, event_id, title, description, evidence_required, guilt_impact)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(d.id, eventId, d.title, d.description, d.evidence, d.guilt);
  });

  console.log('✓ Deductions created');

  // Create evidence - comprehensive case file
  const evidence = [
    // Initial evidence (immediately available)
    {
      id: 'E001',
      title: 'Emergency Call Recording',
      description: 'Emergency services call placed at 20:18',
      type: 'audio',
      category: 'emergency',
      timestamp: '20:18',
      content: 'Call placed by Ananya Krishnan reporting mother unconscious. Male voice heard in background.',
      related: 'ANANYA,PARTICIPANT',
      discovery: 'always'
    },
    {
      id: 'E002',
      title: 'Police Initial Report',
      description: 'First responder assessment',
      type: 'text',
      category: 'police',
      timestamp: '20:25',
      content: `
INITIAL ASSESSMENT - SUDDEN CARDIAC EVENT
Victim: Meera Krishnan, 45
Location: Residence
Time: Approximately 20:15-20:18
Circumstances: Found unconscious, pronounced dead at hospital

INITIAL OBSERVATIONS:
- Household members present: Ananya (daughter), participant (husband)
- No signs of forced entry
- Husband\'s timeline unclear for critical period
- Daughter received call from unknown number 20:10

INITIAL THEORY: Sudden cardiac event, but household circumstances require clarification.
      `,
      related: 'PARTICIPANT,ANANYA,MEERA',
      discovery: 'always'
    },
    {
      id: 'E003',
      title: 'Front Door CCTV - 19:27',
      description: 'Security camera footage showing participant leaving house',
      type: 'video',
      category: 'cctv',
      timestamp: '19:27',
      content: '[VIDEO] Shows male matching participant description exiting through front door with bag',
      related: 'PARTICIPANT',
      discovery: 'always'
    },
    {
      id: 'E004',
      title: 'Participant Phone Location - 19:35 to 20:25',
      description: 'Cell tower data showing phone location',
      type: 'text',
      category: 'digital',
      timestamp: '19:35-20:25',
      content: `
CELL TOWER DATA:
19:35 - Location: 2.3km from residence (consistent with departure)
19:45 - Location: 4.1km from residence
20:02 - Location: 4.8km from residence (gym location)
20:15 - Location: 5.2km from residence
20:25 - Location: 2.1km from residence (returning)

INTERPRETATION: Consistent with participant leaving and returning during event period.
      `,
      related: 'PARTICIPANT',
      discovery: 'always'
    },
    {
      id: 'E005',
      title: 'Family Medical History',
      description: 'Meera\'s health records',
      type: 'text',
      category: 'medical',
      timestamp: null,
      content: `
MEERA KRISHNAN - Medical Summary:
- Diagnosed hypertension, age 38
- Mild cardiac irregularities noted in 2022 stress test
- Prescribed beta-blockers (maintained compliance)
- No recent doctor visits (non-compliant with annual checkup)
- Family history: Father died of cardiac event at age 60

ASSESSMENT: Predisposed to cardiac events, though not imminent.
      `,
      related: 'MEERA',
      discovery: 'always'
    },

    // Timeline evidence
    {
      id: 'E020',
      title: 'Participant Gym Membership Log - 20:05',
      description: 'Entry timestamp at fitness center',
      type: 'text',
      category: 'timeline',
      timestamp: '20:05',
      content: 'Participant entry scanned at gym at 20:05. Checkout logged at 20:17.',
      related: 'PARTICIPANT',
      discovery: 'timeline_search'
    },
    {
      id: 'E021',
      title: 'Ananya Call Log - 20:10',
      description: 'Incoming call to Ananya from restricted number',
      type: 'text',
      category: 'phone',
      timestamp: '20:10',
      content: 'Ananya received incoming call from unknown/restricted number at 20:10. Call lasted 2 minutes. No voicemail.',
      related: 'ANANYA,RAHUL',
      discovery: 'ananya_investigation'
    },

    // Family relationships evidence
    {
      id: 'E025',
      title: 'Ananya\'s Messages to Friend',
      description: 'Text messages about family conflict',
      type: 'text',
      category: 'messages',
      timestamp: null,
      content: `
Ananya to friend (March 15):
"My mom is impossible. She\'s embarrassing the family. I found out she\'s seeing someone from work. Dad would be ashamed."

"She deserves to be scared straight. Not hurt, just... taught a lesson."

"I\'m going to do something to make her understand how serious this is."
      `,
      related: 'ANANYA,MEERA',
      discovery: 'ananya_investigation'
    },
    {
      id: 'E026',
      title: 'Meera\'s Affair - Raghav Connection',
      description: 'Evidence of romantic relationship',
      type: 'text',
      category: 'evidence',
      timestamp: null,
      content: `
EVIDENCE OF AFFAIR:
- Hotel receipts (name: M. Krishnan, companion noted as "R. M.")
- Text messages: "Miss you already. Safe to talk tomorrow?" (from "Raghav")
- Calendar entries labeled "Raghav - Work Discussion" (actually dated meeting times)
- Jewelry receipt: Necklace charged to work card, note: "For you - R"
      `,
      related: 'MEERA,RAGHAV',
      discovery: 'ananya_investigation'
    },

    // Rahul's digital activities
    {
      id: 'E028',
      title: 'Rahul\'s Browser History',
      description: 'Search history from his laptop',
      type: 'text',
      category: 'digital',
      timestamp: null,
      content: `
Browser History (March 20-21):
- "How to scare someone without hurting them"
- "Medical device security research"
- "Cardiac device research" + university name
- "How do cardiac monitoring devices work"
- "Research environment access university"
- Multiple visits to research demo environment
      `,
      related: 'RAHUL,NIKHIL',
      discovery: 'rahul_investigation'
    },
    {
      id: 'E029',
      title: 'Rahul - Nikhil Research Connection',
      description: 'Access logs to research environment',
      type: 'text',
      category: 'digital',
      timestamp: null,
      content: `
RESEARCH ENVIRONMENT ACCESS LOG:
March 21, 19:45 - Access attempt from external IP (Rahul\'s residence)
19:47 - Accessed: "MCI Device Simulation - Research Demo"
19:52 - Downloaded: Technical specifications PDF
20:03 - Accessed demo environment (multiple interactions)

Note: System logs unusual activity around this access window.
      `,
      related: 'RAHUL,NIKHIL',
      discovery: 'rahul_investigation'
    },

    // The planned scare
    {
      id: 'E030',
      title: 'Ananya-Rahul Messages',
      description: 'Planning the scare',
      type: 'text',
      category: 'messages',
      timestamp: null,
      content: `
Ananya to Rahul (March 20):
"What if we made her think something was wrong with her health? Really scared her?"

Rahul: "What do you mean?"

Ananya: "Like, fake a medical thing? Make her panic, realize she\'s not invincible?"

Rahul: "Could research that. Wouldn\'t actually hurt her, right?"

Ananya: "No, just scare. Get her attention."

Rahul: "I know someone who might be able to help. Knows about that medical tech stuff."

Ananya: "Perfect. Let\'s make her understand how serious this is."
      `,
      related: 'ANANYA,RAHUL',
      discovery: 'rahul_investigation'
    },

    // Raghav's criminal operation
    {
      id: 'E040',
      title: 'Meridian Ocean Logistics - Missing Shipments',
      description: 'Audit report of discrepancies',
      type: 'text',
      category: 'evidence',
      timestamp: null,
      content: `
MERIDIAN OCEAN LOGISTICS - INVENTORY DISCREPANCY REPORT

Period: January - March
Missing high-value electronic shipments: 23 units
Estimated value: $890,000

Shipments diverted route (pattern analysis):
- Container numbers: MC-45782, MC-45891, MC-46003, etc.
- Redirected from warehouse B to external facility
- Signatures forged or unauthorized
- Connection: Senior Operations Manager (Raghav Menon) authorized transfers

PRELIMINARY FINDING: Internal theft operation. Requires investigation.
      `,
      related: 'RAGHAV,MEERA',
      discovery: 'workplace_investigation'
    },
    {
      id: 'E041',
      title: 'Meera\'s Investigation Notes',
      description: 'Handwritten notes and documentation',
      type: 'text',
      category: 'evidence',
      timestamp: null,
      content: `
MEERA'S NOTEBOOK (Found in home office):

"March 10:
Noticed container MC-45782 signature doesn't match protocol. Raghav signed authorization - but unusual. Need to verify.

March 15:
Cross-referenced 5 shipments. Pattern. Raghav is diverting to external location. Who is receiving?

March 18:
Found warehouse supervisor notes. Raghav told him to 'look away' during transfers. Payment mentioned. This is organized.

March 20:
Going to confront Raghav tomorrow. Need evidence for company. If I'm wrong, I'm wrong. If I'm right... this is serious."

Last entry ends abruptly.
      `,
      related: 'MEERA,RAGHAV',
      discovery: 'workplace_investigation'
    },
    {
      id: 'E042',
      title: 'Raghav - Payment Records',
      description: 'Financial transfers to third party',
      type: 'text',
      category: 'financial',
      timestamp: null,
      content: `
BANK RECORDS (Raghav\'s Account):
Multiple transfers to external account (24 units @ ~$35,000 per unit):
- Jan 12: $35,200
- Jan 28: $35,150
- Feb 8: $35,100
- Feb 22: $34,980
... (continuing pattern)

Account belongs to: Unknown shell company registered to foreign address.

Total diverted: ~$840,000

Raghav's salary: $95,000/year. Source of funds: Confirmed theft operation.
      `,
      related: 'RAGHAV',
      discovery: 'workplace_investigation'
    },

    // The fatal device event
    {
      id: 'E035',
      title: 'Meera\'s Cardiac Implant Records',
      description: 'Medical device implant history',
      type: 'text',
      category: 'medical',
      timestamp: null,
      content: `
CARDIAC IMPLANT INFORMATION:
Device Type: MCI (Medical Cardiac Interface)
Implant Date: 2019
Manufacturer: CardioTech Systems
Serial: MCI-2019-847-92

Current status: Active monitoring
Last authorized interaction: Routine download (Feb 28, 2024)
Next scheduled check: April 15, 2024

DEVICE CAPABILITIES:
- Remote monitoring authorized
- Firmware updates available (authorized personnel only)
- Configuration adjustable by certified technicians
      `,
      related: 'MEERA',
      discovery: 'medical_investigation'
    },
    {
      id: 'E037',
      title: 'Device Event Log - 20:17',
      description: 'Implant device internal log',
      type: 'text',
      category: 'digital',
      timestamp: '20:17',
      content: `
DEVICE EVENT LOG - MCI-2019-847-92

20:17:03 - CONFIGURATION CHANGE DETECTED
Change type: Threshold adjustment (heart rate alert)
Source: Unauthorized remote access
Authorization: INVALID

20:17:14 - DEVICE STATE CHANGE
Alert settings modified
Patient notification: SUPPRESSED

20:17:45 - DEVICE RESPONSE
Heart rate elevation detected: 145 BPM
Threshold exceeded (normally: 110)
Device attempting compensation

20:18:00 - CARDIAC EVENT
Rhythm irregularity detected
Patient unresponsive to device signals

Note: Configuration change was not authorized by patient or physician.
      `,
      related: 'MEERA,NIKHIL',
      discovery: 'device_investigation'
    },
    {
      id: 'E038',
      title: 'Device Access - Infrastructure Source',
      description: 'Server logs showing device interaction origin',
      type: 'text',
      category: 'digital',
      timestamp: '20:17',
      content: `
SERVER LOG - CardioTech Remote Access

20:17:01 - Connection from IP: 192.168.1.x (Research Network)
Authentication: Credentials (user: nikhil.varma@dev-research)
Device Target: MCI-2019-847-92
Action: Configuration Push
Status: SUCCESS

20:17:03 - Unauthorized configuration applied to device
Alert threshold: Modified from 110 to 145 BPM
Alert suppression: ENABLED
Firmware version: MCI-3.2.1-DEV

20:17:14 - Action complete, connection closed

Note: Access unauthorized by device manufacturer. IP traces to research environment.
      `,
      related: 'NIKHIL',
      discovery: 'device_investigation'
    },
    {
      id: 'E039',
      title: 'Research Network - Nikhil Access',
      description: 'Authentication logs for development infrastructure',
      type: 'text',
      category: 'digital',
      timestamp: '20:17',
      content: `
RESEARCH INFRASTRUCTURE - ACCESS LOG

User: nikhil.varma
Time: 20:16:45 - Connection established
Environment: Development environment (DEV-CARDIAC-01)
Activities:
  20:16:50 - Accessed CardioTech API documentation
  20:16:55 - Retrieved device credentials cache
  20:17:00 - Executed remote configuration script
  20:17:15 - Device interaction completed successfully

Logout: 20:17:45

ANOMALY: Access outside normal working hours (night time access). Credentials used for unauthorized device access.
      `,
      related: 'NIKHIL',
      discovery: 'device_investigation'
    },

    // Nikhil's involvement
    {
      id: 'E043',
      title: 'Nikhil Varma - Employment Record',
      description: 'Background information on CS student',
      type: 'text',
      category: 'evidence',
      timestamp: null,
      content: `
NIKHIL VARMA - Profile
Age: 23
Education: Computer Science major, specializing in cybersecurity
Employment: Contract work with Dev (Freelance developer)
Status: Financial difficulties, seeking paid opportunities

Notable skills:
- Cybersecurity research
- Device vulnerability research
- Infrastructure access management
- Authentication bypass techniques

Previous work:
- Research on implanted device security
- Published research on wireless medical device vulnerabilities
- Access to development environments with medical device simulations
      `,
      related: 'NIKHIL',
      discovery: 'nikhil_investigation'
    },
    {
      id: 'E044',
      title: 'Nikhil\'s Research - MCI Vulnerabilities',
      description: 'Published research paper on cardiac device security',
      type: 'text',
      category: 'evidence',
      timestamp: null,
      content: `
RESEARCH PAPER: "Security Analysis of Medical Cardiac Interfaces"
Author: Nikhil Varma
Published: 2023

Abstract: This paper explores potential vulnerabilities in remote monitoring capabilities of modern medical cardiac devices, including the MCI platform used in clinical practice.

Key findings:
- Remote configuration can be intercepted with specific credentials
- Alert thresholds can be modified without patient authorization
- Device responses to anomalies can be suppressed
- Firmware updates can be applied without clinical oversight

Implications: Research demonstrates vulnerability exploitation potential in medical device infrastructure.
      `,
      related: 'NIKHIL',
      discovery: 'nikhil_investigation'
    },
    {
      id: 'E045',
      title: 'Dev - Nikhil\'s Employer',
      description: 'Information about Dev (freelance contractor)',
      type: 'text',
      category: 'evidence',
      timestamp: null,
      content: `
DEV (Freelance Developer):
- Contracts with research institutions
- Maintains development infrastructure for medical research
- Known to hire junior developers (including Nikhil)
- Infrastructure includes medical device simulation environments

Note: Dev is NOT the perpetrator. Dev\'s infrastructure simply provides access point used by Nikhil.
      `,
      related: 'NIKHIL,DEV',
      discovery: 'nikhil_investigation'
    },
    {
      id: 'E046',
      title: 'Nikhil\'s Laptop - Chat History',
      description: 'Discovered messages indicating knowledge of plan',
      type: 'text',
      category: 'digital',
      timestamp: null,
      content: `
CHAT HISTORY (Nikhil's laptop - recovered):

March 21, 19:30 (to unknown contact):
"Interesting research environment activity tonight. Someone accessing medical device demo."

19:35: "I recognize the pattern. Someone planning something. Let me check who."

19:40: "It's about a woman - Meera Krishnan. I know her. Works at Meridian."

19:45: "The research access... they're planning something medical-related."

19:50: "I have an idea. What if I modify their plan? Make it real instead of fake?"

20:00: "I have her device info. I have access. I can make this work."

20:15: "Done. The plan is underway. She'll never know what hit her."
      `,
      related: 'NIKHIL,ANANYA,RAHUL,MEERA',
      discovery: 'digital_forensics'
    },
    {
      id: 'E047',
      title: 'Nikhil - Motive Connection',
      description: 'Connection between Nikhil and Raghav',
      type: 'text',
      category: 'evidence',
      timestamp: null,
      content: `
INVESTIGATION FINDING - Nikhil Connection to Raghav:

Nikhil's financial records show:
- Debt situation: $45,000 in student loans
- Recent income: Irregular freelance work
- Bank transactions: Regular transfers from unknown account (~$2,000/month for past 6 months)

Source investigation: Transfers originate from Raghav's company account (shell entity).

INTERPRETATION: Nikhil was likely financially supported by Raghav's criminal operation.

When Meera began investigating Raghav's theft operation, she became a threat to both Raghav AND Nikhil's income.

Nikhil's motive: Financial dependency on Raghav. Removal of threat = protection of income stream.
      `,
      related: 'NIKHIL,RAGHAV',
      discovery: 'financial_investigation'
    }
  ];

  evidence.forEach(e => {
    db.prepare(`
      INSERT INTO evidence (id, event_id, title, description, type, category,
        timestamp, related_characters, hidden, content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      e.id,
      eventId,
      e.title,
      e.description,
      e.type,
      e.category,
      e.timestamp,
      e.related,
      e.discovery === 'always' ? 0 : 1,
      e.content
    );
  });

  console.log(`✓ ${evidence.length} evidence records created`);

  // Create a test participant
  const participantId = uuid();
  db.prepare(`
    INSERT INTO participants (id, event_id, user_id, participant_name, guilt)
    VALUES (?, ?, ?, ?, 100)
  `).run(participantId, eventId, userId, 'Test Participant');

  // Initialize case state for test participant
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

  // Discover initial evidence for test participant
  const initialEvidence = ['E001', 'E002', 'E003', 'E004', 'E005'];
  initialEvidence.forEach(eid => {
    const discoveryId = uuid();
    db.prepare(`
      INSERT INTO evidence_discoveries (id, participant_id, evidence_id)
      VALUES (?, ?, ?)
    `).run(discoveryId, participantId, eid);
  });

  console.log('✓ Test participant created with initial evidence');

  console.log('\n✓ Database seeded successfully!');
  console.log('\nTest Credentials:');
  console.log('  Email: test@mercy.local');
  console.log('  Password: test123');
  console.log('\nAdmin Credentials:');
  console.log('  Email: admin@mercy.local');
  console.log('  Password: admin123');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
