
# HV Verify

## Project Description
HV Verify is a demo e-voting system with a React/Vite frontend and a FastAPI backend. It supports voter registration, voter ID authentication, ballot casting, receipt verification, and live results.

## Features
- Voter registration with CNIC-based identity checks
- Voter ID recovery for previously registered identities
- Voter authentication before ballot access
- One-person-one-vote enforcement (`has_voted` flag)
- Receipt verification for vote existence
- Live results and turnout metrics
- Admin dashboard (static UI)
- Simulated liveness-style verification UI using webcam permissions
- Simulated blockchain hash on vote receipts

## Project Structure
```
backend/
  app/
    database.py
    models.py
    schemas.py
    auth.py
    utils/
      jwt_handler.py
      security.py
  main.py
  requirements.txt
frontend/
  public/
  src/
    api/
    components/
    hooks/
    layout/
    pages/
    App.jsx
    main.jsx
  package.json
package.json
```

## Installation

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Run both (from project root)
```bash
npm install
npm run dev
```

## Environment Variables
No .env file is required in the current implementation.

## API Endpoints
Base URL: `http://<host>:8000`

- `GET /` — Health check
- `POST /register` — Register voter (or recover existing voter ID)
- `GET /voters` — List all voters
- `GET /authenticate/{voter_id}` — Validate voter ID
- `GET /candidates` — List all candidates
- `POST /vote` — Cast a vote
- `GET /verify/{receipt_code}` — Verify a receipt
- `GET /results` — Results summary

## Voting Flow
1. Register with CNIC and identity details.
2. Complete the simulated liveness UI step in the frontend.
3. Receive a voter ID (or recover an existing one).
4. Authenticate with voter ID to access the ballot.
5. Cast a vote and receive a receipt.
6. Verify the receipt through the public verification page.
7. View live results on the results page.

## Security Features (Implemented)
- Duplicate registration prevention by CNIC and identity fields
- Vote replay protection using `has_voted`
- Receipt verification without revealing candidate
- CORS enabled for all origins (demo configuration)

## Troubleshooting
- **Frontend cannot reach backend**: Ensure backend is running on port 8000 and the frontend host matches `window.location.hostname` in [frontend/src/api/index.js](frontend/src/api/index.js).
- **Camera permission blocked**: Browser may require HTTPS or `http://localhost` for `getUserMedia`.
- **Verification UI not proceeding**: The liveness step is a simulated flow; ensure the modal is open and proceed through steps.

## Development Notes
- Backend auth utilities exist in [backend/app/auth.py](backend/app/auth.py) but are not wired into the main FastAPI app.
- Candidate seed data is created at startup in [backend/main.py](backend/main.py).
- Admin page metrics are currently static UI values.


## PHASE B3 — Public Vote Ledger
Purpose: Provide a public, privacy-safe ledger so anyone can confirm that votes exist without revealing voter identities or ballot choices.

Route:
- `/ledger/votes`

API Endpoint:
- `GET /public/votes`

Privacy Protection Rules:
- Only receipt ID, timestamp, and status are shown.
- No voter data, no candidate data, and no ballot choices are exposed.

Public Search Capability:
- Search by receipt ID or verification code only.

Transparency Impact:
- Improves public trust by confirming vote existence while preserving ballot secrecy.

## PHASE B4 — Public Audit Ledger
Purpose: Provide a public, privacy-safe audit feed so anyone can review election-related system events without exposing sensitive details.

Route:
- `/ledger/audit`

API Endpoint:
- `GET /public/audit`

Public Audit Event Types:
- Registration events
- Verification events
- Voting events
- System events
- Admin events (public-safe)

Privacy Rules:
- Only event type, timestamp, and status are shown.
- No personal data, credentials, or internal identifiers are exposed.

Transparency Benefits:
- Improves trust by surfacing public-safe operational signals without compromising security.

## PHASE C1 — Audit Viewer
Purpose: Provide administrators with a centralized audit inspection interface inside the admin dashboard.

Location:
- Admin Dashboard → Audit tab

Admin Access Requirements:
- Requires admin authentication.

Filtering Features:
- All events
- Registration
- Verification
- Voting
- Administration
- Security
- System

Search Features:
- Search by event type, category, or description.

Audit Categories:
- Registration, Verification, Voting, Administration, Security, System

Benefits:
- Improves administrative oversight while keeping sensitive data protected.

## PHASE C2 — Suspicious Activity Detection
Purpose: Automatically flag potentially suspicious behavior using rule-based analysis of audit logs.

Detection Rules:
- Repeated verification failures
- Repeated login failures
- Repeated admin login failures
- Repeated reset or recovery attempts
- Registration spikes
- Repeated security flag events

Severity Levels:
- Low, Medium, High, Critical

Admin Usage:
- Admin Dashboard → Suspicious tab

Security Benefits:
- Provides rapid visibility into anomalous patterns without exposing sensitive data.

## PHASE C3 — Audit Dashboard
Purpose: Provide administrators with a high-level analytics dashboard for system activity, security health, verification performance, and audit statistics.

Location:
- Admin Dashboard → Audit Dashboard tab

Admin Access Requirements:
- Requires admin authentication (JWT credentials verified).

Displayed Metrics:
- Total Registrations
- Successful Registrations
- Successful Verifications
- Failed Verifications
- Votes Cast
- Verification Codes Generated
- Suspicious Activity Alerts
- Admin Actions Logged
- Audit Events Logged
- System Events Logged

Recharts Visualizations:
1. Event Distribution (Registration, Verification, Voting, Security, and Admin events)
2. Verification Outcomes (Successful vs. Failed/Flagged biometric validations)
3. Suspicious Activity Breakdown (Low, Medium, High, and Critical alert levels)
4. Daily Activity Trend (Events count per day over the last 7 days)

Insights Panel:
- Real-time calculations of verification success rate, most common audit event, and high/critical severity alerts. All calculations are derived directly from the SQL database records.

Security Benefits:
- Centralizes security metrics and trends, helping administrators quickly identify traffic surges, biometric bypass/failures, or anomalous administrative changes in a unified, read-only interface.

## PHASE C4 — Audit Report Export
Purpose: Allow administrators to export audit information for reporting, demonstrations, reviews, and compliance purposes.

Location:
- Admin Dashboard → Audit Dashboard tab

Export Formats:
- CSV
- PDF

Admin Access Requirements:
- Requires admin authentication (JWT credentials verified).

Export Filters:
- By Severity (All Events, Low, Medium, High, Critical)
- Categories (Registration, Verification, Voting, Security, Administration, System)

Contents Included:
- Safe fields including Timestamp, Event Type/Action, Severity, and non-sensitive Details.

Security Protections:
- PII, Passwords, Biometric Data, and Candidate Choices are never exposed in reports.

Benefits:
- Enables robust regulatory reporting and offline analysis while maintaining the privacy and security boundaries of the system.

## PHASE D — Receipt & Verification Ecosystem
Purpose: A unified ecosystem to generate, manage, and verify vote receipts using the existing Verification Code logic.

D1 — QR Receipt Generation:
- Automatically generates a QR Code upon voting containing the public verification URL.
- Embeds the existing Verification Code without creating a secondary receipt system.

D2 — QR Verification:
- Scanning the QR Code opens the public verification page and automatically populates the code.
- Automatically triggers a secure verification check upon page load.

D3 — Receipt History:
- Authenticated voters have a "My Receipts" dashboard on their Profile page.
- Lists all past vote receipts, displaying the receipt code, date, and a quick-verify action button.
- Strictly excludes candidate selection data from this view.

D4 — Public Verification Portal:
- Route: `/verify-public`
- A dedicated portal accessible to anyone with a valid receipt to confirm a vote's existence and verification status.

Privacy Protection Rules:
- Verification checks strictly output "Vote Confirmed/Verified" and the Blockchain Hash.
- Candidate choices, voter identities, biometric data, and other sensitive PII are never revealed during verification.

Benefits:
- Increases trust and transparency by making the verification process frictionless.
- Ensures absolute anonymity and non-duplication of vote records.

## PHASE E — Trust & Integrity Layer
Purpose: Cryptographic protection against database tampering using deterministic local SHA-256 hash validation for registrations and votes.

E1 — Vote Hashing:
- The system generates a deterministic SHA-256 hash for every cast vote.
- Computation: `sha256(voter_id + candidate_id + receipt_code)`.
- The hash is saved directly in the `vote_hash` column.

E2 — Registration Hashing:
- The system generates a deterministic SHA-256 hash for every registered voter.
- Computation: `sha256(voter_id + cnic + full_name)`.
- The hash is saved directly in the `registration_hash` column of the `voters` table.

E3 — Hash Visibility:
- Stored cryptographic hashes are visible via public ledgers and receipts.
- Recalculation logic is fully open and verifiable.

E4 — Integrity Checker:
- Location: Admin Dashboard → Integrity tab.
- Recalculates registration and vote hashes for all database records dynamically.
- Identifies any modifications, additions, or deletions made directly in the database (bypassing the application logic).
- Reports aggregate metrics: total checked, total tampered, and system health status.
- Displays full expected vs stored hash comparisons for any compromised record.

Benefits:
- Eliminates reliance on database trust. Any direct DB editing instantly triggers validation failure.
- Provides absolute auditability for administrators.

## License
No license specified.
# hc-verify

---

# Updated Work / Major Recent Changes

### Latest Updates

- **Backend Interface in Admin Panel**  
  Implemented a backend interface within the admin panel for improved management and control.  
  _([See commit 54f2ff7](https://github.com/princemuhammadsahilkhan/hc-verify/commit/54f2ff7c59e61ce1fe97e302547cd70a8fd5ff7e))_

- **Comprehensive Language Translation**  
  Integrated language translation for all pages, improving accessibility for multilingual users.  
  _([See commit b6ebad69](https://github.com/princemuhammadsahilkhan/hc-verify/commit/b6ebad69d0dbc1ba51c2fcac2f36ab4127b57ada))_

- **Security and Recovery**  
  Added advanced security features, facial recognition for liveness detection, admin recovery features, and a language switcher.  
  _([See commit 7e69fb42](https://github.com/princemuhammadsahilkhan/hc-verify/commit/7e69fb4281eab4d9563f66e366cf20ae50260044))_

- **AI Liveness Detection**  
  Introduced AI-powered liveness checks as part of the authentication process, enhancing defense against spoofing.  
  _([See commit d6156d15](https://github.com/princemuhammadsahilkhan/hc-verify/commit/d6156d15ad1de7300583cf102d51a7346294f0b9))_

- **Initial Version**  
  Basic structure and features of the e-voting system scaffolded.  
  _([Initial commit](https://github.com/princemuhammadsahilkhan/hc-verify/commit/9cccdfa35f19183b624dd0143e91c30d092274ea))_

### Complete Feature Summary
- Voter registration with CNIC-based checks.
- Secure voter authentication and recovery.
- One-vote-per-person enforcement.
- Ballot casting with cryptographic receipt.
- Simulated blockchain hash generation for vote receipts.
- Admin dashboard and backend management.
- Live metrics and results tracking.
- AI-based liveness and face recognition.
- Multilingual and language-switcher support.
- Static and simulated liveness UI (webcam).
- Security hardening: replay protection, uniqueness, and privacy.
- API endpoints for every voting and admin operation.

### Language Composition
| Language    | Percentage |
|-------------|------------|
| Python      | 97.1%      |
| C           | 0.9%       |
| Cython      | 0.8%       |
| C++         | 0.7%       |
| JavaScript  | 0.3%       |
| Fortran     | 0.1%       |
| Other       | 0.1%       |

For further project history and minor updates, see the [commit history](https://github.com/princemuhammadsahilkhan/hc-verify/commits/main).

## PHASE G — Security Demonstration Center
Purpose: Provide an interactive security simulation environment inside the Admin Dashboard for security education, faculty evaluations, and Final Year Project (FYP) showcases.

Location:
- Admin Dashboard → Demo Center tab

Admin Access Requirements:
- Requires admin authentication (JWT credentials verified).

Simulated Features:

1. G1 — Fraud Simulation:
   - Simulates threat scenarios such as IP Rate Limiting Exploits, Account Lockout Bypass attempts, CNIC Regex injections, Phone validation bypass, and Biometric facial recognition mismatches.
   - Shows exactly how the active system detects and blocks/flags each threat type.

2. G2 — Duplicate Vote Demonstration:
   - Simulates a voter attempting to vote twice.
   - Demonstrates the transaction and database constraint protections checks that prevent duplicate votes from being created.

3. G3 — Verification Failure Demonstration:
   - Simulates verification failures using Invalid, Expired, and Malformed receipt codes.
   - Shows the active rejection behavior and details the security benefits of code pattern and session validation.

Educational Benefits:
- Clear visualization of attack vectors (Attack Attempt).
- Visual feedback on active defenses (Protection Activated).
- Theoretical explanation of protection mechanisms (Why It Failed).
- Contextualization of threat mitigation (System Benefit).

Security Benefits:
- Visualizes real security constraints like Rate Limiting, lockouts, input sanitization, and cryptographic database checking.
- Educates auditors and evaluators on system robustness without compromising the live database state.

## PHASE H — Advanced Cryptography Demonstration Center
Purpose: Provide an interactive educational sandbox illustrating key mathematical and cryptographic concepts used in modern, secure, and privacy-preserving election platforms.

Location:
- Admin Dashboard → Crypto Center tab

Admin Access Requirements:
- Requires admin authentication (JWT credentials verified).

Cryptographic Concepts Demonstrated:

1. Digital Signatures (H1):
   - Demonstrates how message payloads are converted into a SHA-256 hash and encrypted with a simulated Private Key to produce a signature.
   - Shows how the signature is verified using the Public Key, proving data origin and detecting if the payload has been tampered with.

2. Secret Sharing (H2):
   - Demonstrates Shamir's Secret Sharing scheme by splitting a master secret key (e.g., tally password) into N shares with a threshold T.
   - Illustrates that the secret can only be reconstructed if at least T shares are provided.

3. Threshold Cryptography (H3):
   - Demonstrates collaborative decryption where a threshold number of Trustees must approve tally unlocking.
   - Toggling trustee check states showcases that decryption attempts fail below the threshold and succeed when the threshold is met.

4. Zero Knowledge Proofs (H4):
   - Demonstrates proving knowledge of voter credential tokens without exposing the token itself using ZK-SNARK mock proofs.
   - Shows how validators verify public hashes and proofs without gaining access to user secrets.

Educational Benefits:
- Visual explanation of *What It Is*, *Why It Exists*, *How It Works*, and *Benefits* for all modules.
- Contextualization of *Election Use Cases* (ballot receipts, board tallies, private credentials) and *Limitations*.
- Provides a reference prototype for FYP presentations.

Security Concepts Demonstrated:
- Integrity protection (SHA-256, RSA).
- Decoupled key management (Shamir's Secret Sharing).
- Multi-party trust authorization (Threshold Decryption).
- Absolute voter privacy and data minimization (Zero-Knowledge Proofs).

## PHASE I — UI & UX Refinement
Purpose: Polish the visual styles, responsiveness, transitions, and accessibility features across the entire system to deliver a professional, cohesive user interface.

Design Improvements:
- **Consistent Tokens**: Configured clear HSL variables for background, primary, and secondary states.
- **Glassmorphism Refinement**: Enhanced card panels (`.card`) with micro-borders, backdrop blur filters, and depth elevations.
- **Form Focus Glows**: Added smooth transitions for `.input-wrap` boundaries on focus-within, providing a clean glow shadow in the theme colors.
- **Refined Badges**: Added micro-borders and HSL matching text colors to status pills (`.status-badge`), improving definition and aesthetics.

Responsiveness Improvements:
- Improved alignment wrapping for table rows (`.result-item`, `.admin-row`) and form layout columns under mobile breakpoints.
- Restricted horizontal scrolling and fixed element clipping in tight container widths.

Accessibility Enhancements:
- **Visible Focus Outlines**: Enforced a clear, animated outline ring (`*:focus-visible`) for all interactive elements to support keyboard navigation.
- **Custom Scrollbars**: Customized standard scrollbars (`::-webkit-scrollbar`) to match the emerald and teal primary colors.
- **Consistent Typographical Contrast**: Optimized contrast ratios for readability of label elements and helper hints.

Micro-Interactions:
- Added interactive active click scaling (`transform: scale(0.97)`) on action buttons for tactile click feedback.
- Integrated translate shifts (`transform: translateX(2px)`) on row hover triggers.

## Temporary Liveness Feature Flag

To streamline development and testing in environments where webcams or client-side AI processing are not needed or available, a safe feature flag has been introduced to control client-side face liveness verification.

### Purpose
To temporarily bypass the client-side webcam prompt, AI model loading, and liveness checklist steps during voter registration, allowing immediate database registration and direct transition to the voting ballot screen.

### How to Disable Liveness (Default)
In the file [frontend/.env](file:///c:/Users/Admin/Desktop/hc-verify-main/frontend/.env), ensure the flag is set to `false`:
```env
VITE_ENABLE_LIVENESS=false
```
When set to `false` (or when the environment variable is omitted), the registration page will register the voter directly and bypass the camera verification step.

### How to Enable Liveness
To restore the complete client-side AI liveness check, change the environment flag to `true`:
```env
VITE_ENABLE_LIVENESS=true
```
When set to `true`, the application will immediately require camera permissions, load the MediaPipe and TensorFlow models, and execute the standard multi-step face and movement verification check. No additional code edits are required.

### Safety Benefits
- **Zero Deletions**: No MediaPipe or TensorFlow code, configurations, or packages are uninstalled or deleted from either the frontend or backend.
- **Instant Restore**: The system can be toggled back to enforce liveness checks in production by editing a single config value.
- **Bypass Safety**: Bypass occurs entirely on the client, preserving registration integrity, voting flow, receipts, blockchain audit logs, and database constraints without altering any core backend schemas.

### Development Workflow
Developers can configure their local setups by editing [frontend/.env](file:///c:/Users/Admin/Desktop/hc-verify-main/frontend/.env). This allows local registration testing without camera dependencies, while production deployments can keep `VITE_ENABLE_LIVENESS=true` to guarantee full biometric anti-spoofing security.

## Admin Dashboard Cleanup & Reorganization

To deliver a professional, presentation-ready interface for Faculty evaluations and showcases, the Admin Dashboard has been reorganized to present a cleaner, less crowded, and executive-level user experience.

### Removed UI Features
The following features have been completely removed from the user interface:
- **Voters**: Removed the flagging/managing list view.
- **API Explorer**: Hidden the backend endpoints testing utility panel.
- **System**: Hidden the system environment metrics and developer endpoint overview.

*Note: All corresponding backend API routes, models, controllers, and services remain active and completely unaltered.*

### Dashboard Organization & Navigation Groups
The dashboard has transitioned from a crowded horizontal button tabs list to a responsive left sidebar navigation layout. Features are logically grouped by operational area:
1. **Overview & Analytics**:
   - **Dashboard**: High-level voter metrics, operational service checks, and integrity indicators.
   - **Analytics Report**: Rich visual graphs (Recharts) detailing registration logs, daily trends, outcomes, and alert classifications.
2. **Election Control**:
   - **Candidates**: Interactive candidate registration and list management.
   - **Pending Reviews**: Biometric check investigations and manual voter review resolution.
3. **Audit & Security**:
   - **Audit Logs**: Filterable and searchable election log timeline.
   - **Suspicious Activity**: Automatic detection alerts categorizing system threats.
   - **Database Integrity**: Dynamic SHA-256 validator to verify database sanity.
4. **FYP Demonstrations**:
   - **Attack Simulator**: Interactive sandbox to simulate malicious behaviors (rate-limits, face checks).
   - **Cryptography Sandbox**: Advanced cryptography showcase (ZKPs, Shamir's secret shares, RSA signatures).

### Usability & Responsiveness Enhancements
- **Clean Sidebar Layout**: Spacing, section groupings, visual divider lines, and text/icon hierarchy are optimized for executive presentations.
- **Responsive Drawer for Small viewports**: On tablet/mobile, the sidebar collapses and toggles via a header hamburger toggle button.
- **Contained Scrolling & Spacing**: Elements align to prevent layout clipping and eliminate horizontal scrollbars.


## PostgreSQL Database Migration

This project has been updated to support PostgreSQL as its production-grade database, while retaining SQLite as a fallback.

### Dependencies
The backend requires additional asynchronous drivers for both databases, which are configured:
- `asyncpg` for PostgreSQL
- `aiosqlite` for SQLite

### Configuration
1. Create a PostgreSQL database named `hv_verify` (e.g. in pgAdmin or via `psql`).
2. Add your PostgreSQL connection URI to the `backend/.env` file:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hv_verify
   ```
   *Note: If `DATABASE_URL` is omitted or commented out, the application automatically falls back to the SQLite file `./hc_verify.db`.*

### Data Migration
To automatically create all database tables in PostgreSQL and migrate existing SQLite records (Candidates, Voters, Votes, and Audit Logs) without data loss or duplicates:

1. Activate your virtual environment and navigate to the backend directory:
   ```bash
   cd backend
   # Activate venv on Windows:
   .\venv\Scripts\activate
   # Or on Unix/macOS:
   source venv/bin/activate
   ```
2. Run the migration script:
   ```bash
   python migrate_sqlite_to_pg.py
   ```

### Fallback & Safety
- The migration process is entirely non-destructive to the SQLite database.
- Toggling back to SQLite can be done at any time by simply commenting out the `DATABASE_URL` line in `backend/.env` and restarting the application.

# test webhook trigger
# webhook test final
# push event subscription test
