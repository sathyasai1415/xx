# Deploying MiSlice to Vercel (production)

The frontend is a Vite SPA; the one server route (`/api/parse-pizza`) is a Vercel
serverless function. Firebase (Auth + Firestore `pizza` database) is the backend.

## 1. Deploy

From this project folder:

```bash
vercel login          # opens browser, one-time
vercel                # first deploy → answer prompts (creates a Preview)
vercel --prod         # promote to production
```

Defaults are correct (configured in `vercel.json`):
- Build command: `vite build`
- Output directory: `dist`
- SPA rewrites for client-side routing; `/api/*` served as functions

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)

| Name | Required | Notes |
|---|---|---|
| `GEMINI_API_KEY` | optional | Enables AI smart-search parsing. Without it, search uses a safe mock. Set for **Production**. |

The Firebase **web** config (`firebase-applet-config.json`) is shipped in the client
bundle — that's expected; web API keys are public identifiers, not secrets. Access is
controlled by Firestore security rules, not by hiding the key.

After setting env vars, redeploy: `vercel --prod`.

## 3. CRITICAL — authorize the Vercel domain in Firebase

Firebase Auth rejects sign-in from unknown domains. After the first deploy you'll get a
URL like `mislice-xxxx.vercel.app`. Add it (and any custom domain) here:

**Firebase Console → Authentication → Settings → Authorized domains → Add domain**
https://console.firebase.google.com/u/0/project/mislice-364af/authentication/settings

- Email/Password login works without this, but **Google sign-in will fail** until the
  domain is authorized.

## 4. Verify in production

1. Open the production URL.
2. Sign up as a customer (or Google) and as a store owner — confirm both routes.
3. Check the new `users/{uid}` docs appear in the Firestore `pizza` database.
4. Open the Deals page — it reads live from Firestore.

## Production-readiness notes

- ✅ Auth (email/password + Google), store/deal browsing, store provisioning, security
  rules — all backed by Firebase.
- ⚠️ Cart, checkout, order history and saved pizzas currently persist in the browser
  (`localStorage`), not Firestore — they work per-device but aren't synced/server-persisted yet.
- ⚠️ Payments are not implemented.
- Firebase is on the **Spark (free)** plan; fine for early real-world usage within free
  quotas. Upgrade to **Blaze** before heavy traffic or to use Cloud Functions.
