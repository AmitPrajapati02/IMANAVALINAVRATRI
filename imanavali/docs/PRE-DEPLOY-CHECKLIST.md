# Pre-deploy checklist

Run before production deploy or after fee-logic changes:

- [ ] `npm test` — unit tests pass (includes reg_session bundle canary)
- [ ] `npm run test:e2e` — with API on :3001: Male IMA Member + Male Donor → ₹1,000 total, donor `FeeAmount=500`
- [ ] Confirm deploy stops old Node process on API port (see README “Deploy / stale-process risk”)
- [ ] `npm run audit:ima-fees` — review refund candidates after stale-process window
- [ ] Clear browser `reg_session` cookies not required on server; users with old cookies should re-register if payment fails
