# Champions League 2026 Predictions (Next.js + Firebase)

App flow:
- login/register with name + password using Firebase Authentication
- choose a team-logo avatar
- fill full knockout picks
- shared dashboard saved in Cloud Firestore

## Firebase setup

Create a Firebase project and enable:
- **Authentication** → Email/Password provider
- **Firestore Database**

Set these env vars in `.env.local`:

```bash
# Firebase Web SDK config (client auth)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...

# server aliases still supported
FIREBASE_WEB_API_KEY=...
FIREBASE_PROJECT_ID=...

# Firebase Admin SDK credentials (for API routes)
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

If you run on Google Cloud with Application Default Credentials, `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` can be omitted.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.
