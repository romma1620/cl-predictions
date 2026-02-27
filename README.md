# Champions League 2026 Predictions (Next.js)

Super simple app with:
- name + password login (plain text, intentionally not secure)
- avatar selection
- winner picks for 8 predefined UCL matches
- shared dashboard with all users' predictions

## Why this storage approach?
For your "super simple" requirement, this project stores data in a local JSON file at `data/store.json` through Next.js API routes.

Pros:
- zero external services
- fastest setup
- easy to understand/edit

Cons:
- not production-safe
- resets if deployed on ephemeral hosting
- no real auth security

If you want a cloud option next, Firebase Firestore would be the easiest upgrade.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.
