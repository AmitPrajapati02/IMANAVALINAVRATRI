# IMA Navli Navratri — Node.js + React

Modern rebuild of the IMA Navli Navratri registration website.

## Stack

- **Frontend:** React 18, Vite, React Router, Bootstrap 5.3
- **Backend:** Express, SQL Server (stored procedures), Razorpay, JWT httpOnly cookies

## Setup

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, Razorpay keys, and `ADMIN_SESSION_SECRET`.
2. Install dependencies:

```bash
cd imanavali
npm install
npm install --prefix client
npm install --prefix server
```

3. Run development (client + API):

```bash
npm run dev
```

- Client: http://localhost:5173 (Vite dev — use this, not the built SPA on the API port)
- API: http://localhost:3001

`npm run dev` runs `predev`, which frees port **3001** before starting nodemon so an orphan API process cannot keep serving old code.

## Production

```bash
npm run build
npm start
```

`prestart` also frees port 3001 before `node src/index.js`. Express serves the React build and `/uploads` static files.

**Deploy / stale-process risk:** `npm start` replaces the listener on 3001 via `prestart`. If you deploy with PM2, IIS, or a custom script, ensure the deploy **stops the old process** before binding the port — same class of bug as dev (duplicate Node on 3001 serving pre-fix code). Prefer `pm2 restart` or stop-then-start, not `pm2 start` on an already-running app without reload.

## Testing

```bash
npm test              # unit tests (fee rules + reg_session canary)
npm run test:e2e      # API must be running on :3001 (Male IMA + Male Donor → ₹1,000)
npm run test:all      # unit + e2e
npm run audit:ima-fees # DB + Razorpay overcharge audit (see --days=14)
```

CI runs unit tests on every push; E2E runs when `DATABASE_URL` and Razorpay secrets are configured in GitHub Actions.

## Troubleshooting: stale API on port 3001

If fee logic looks wrong but `fees.js` on disk is correct:

1. Check for a duplicate process on port 3001:
   - **Windows:** `netstat -ano | findstr :3001`
   - **macOS/Linux:** `lsof -i :3001`
2. If nodemon logs **"clean exit — waiting for changes"** while the app still responds, another process is likely holding 3001.
3. Run `node scripts/free-api-port.js` or `npm run predev`, then restart dev.
4. Clear the `reg_session` cookie and register again.

**Stale-code signature in JWT:** `bundlePayments[]` entries contain a `fee` field and **no** `playerType`. Current code stores `playerType` only. Unit tests fail if that shape regresses.

## Project structure

```
imanavali/
├── client/     # Vite + React SPA
├── server/     # Express REST API
├── scripts/    # free-api-port.js (predev/prestart)
└── .env        # Secrets (not committed)
```

Reference MVC source: `../imanavali` (ASP.NET MVC 5).
