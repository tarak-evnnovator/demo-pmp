# ChargeIndia Partner Portal Design Demo

Frontend copied from the current ChargeIndia Partner Portal. Only the API adapter
and demo login presets differ; no backend, database, email, or webhook is called.

## Run

`npm install`, then `npm run dev` at http://127.0.0.1:5175.

eMSP: `xyz.admin@example.com`; CPO: `mnq.admin@example.com`. Password: `demo`.
Use the login presets or switch portal from Profile. Both environments are simulated.

## Fixtures

Each portal has five transactions (Started, Charging, Stopped, CDR Received,
Failed), complete overview/timeline, and a full CDR payload with cost and periods.
Two connected partners: Active and Suspended. Two available partners: Pending
connection and not requested. Removal and connection histories are separated.
Logs include success and failures, request/response headers and bodies, and cURL.
Alerts cover low/medium/high, open/resolved, session and CDR issues.
Team includes admin/operator/finance, enabled/disabled members, pending/expired
invitations. Audit records cover login, connect/remove, invite, add and access changes.

Requests, routing toggles, invitations, resend, member changes, and audit entries
persist in this tab's sessionStorage across reloads. Filtering, export, pagination,
drawers and tabs use the production frontend. Pending requests never change routing.
No internal review API is simulated. Password changes affect only this demo session.

Reset fixtures in the browser console:
`sessionStorage.removeItem('chargeindia-designer-demo-v2'); location.reload()`.

All identities, credentials, URLs and records are dummy values. Never use real credentials.
