# ChargeIndia Partner Portal

One frontend for eMSP and CPO users. Both sign in at `/login` on the same origin. The authenticated party role selects the appropriate workspace. CPO UI lives in `src/cpo`; shared authentication lives in `src/auth`.

The single Vite server runs on port 5174 and proxies `/portal/v1`, `/partner/v1`, and `/cpo/v1` to `partner-api` on port 5679. Do not start a second CPO frontend server.

```powershell
cd apps/partner-web
npm.cmd run dev
```

Open `http://localhost:5174/login`. Run `npm.cmd run build` to check and bundle both workspaces.
