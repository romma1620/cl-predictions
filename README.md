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
FIREBASE_WEB_API_KEY=...
FIREBASE_PROJECT_ID=...
# optional aliases (also supported):
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.
