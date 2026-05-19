# HV Verify

## Project Description
HV Verify is a demo e-voting system with a React/Vite frontend and a FastAPI backend. It supports voter registration, voter ID authentication, ballot casting, receipt verification, and live results reporting. The backend uses a local SQLite database and generates a simulated blockchain hash for vote receipts.

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

## License
No license specified.
# hc-verify
