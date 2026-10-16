# Copy these files into the CRATE NIGHT repo (main)

Everything in this folder maps to the CRATE NIGHT repository root.

| File in `crate-night/` | Goes to |
| --- | --- |
| `index.html` | repo root (replaces existing) |
| `styles.css` | repo root |
| `firebase.js` | repo root (see note 1) |
| `app.js` | repo root |
| `js/ui.js`, `js/auth.js`, `js/apply.js`, `js/status.js`, `js/admin.js` | repo root `js/` |
| `firestore.rules` | repo root (replaces existing) |
| `storage.rules` | repo root (replaces existing) |
| `firebase.json` | repo root (replaces existing) |
| `.github/workflows/firebase-deploy.yml` | repo root `.github/workflows/` |

## One-time owner steps (human-only, per CRATE-NIGHT-AGENT.md)

1. **Web API key.** Firebase Console → Project settings → Your apps → copy the
   Web API key into `firebase.js` (`apiKey: "YOUR_WEB_API_KEY"`). The project
   ID, sender ID, and app ID are already filled in.
2. **Auth providers.** Firebase Console → Authentication → Sign-in method:
   enable Email/Password, Google, and Phone; set the SMS region policy; add
   every production domain under Authentication → Settings → Authorized domains.
3. **Deploy secret.** GitHub → Settings → Secrets and variables → Actions →
   add `FIREBASE_SERVICE_ACCOUNT` (service-account JSON from Firebase Console →
   Project settings → Service accounts). The workflow fails with a precise
   error until this is set, then deploys Hosting + Firestore + Storage rules.

## Deliberately not included

- **User-to-user messaging** — disabled per CRATE-NIGHT-AGENT.md.
- **Credentials** — no service-account JSON, private keys, passwords, or OTPs
  are committed anywhere in these files.
