  stats-service/
  ├── Dockerfile
  ├── package.json
  └── src/
      ├── index.js        — Express app, health endpoint, error handling
      ├── db.js           — mssql connection pool
      └── routes/
          └── stats.js    — all stats endpoints

  Available endpoints on http://localhost:3001:

  ┌───────────────────────┬────────────────────────────────────────────────┐
  │       Endpoint        │                  Description                   │
  ├───────────────────────┼────────────────────────────────────────────────┤
  │ GET /health           │ DB connectivity check                          │
  ├───────────────────────┼────────────────────────────────────────────────┤
  │ GET /stats/overview   │ Totals by status, priority, unassigned, stale  │
  ├───────────────────────┼────────────────────────────────────────────────┤
  │ GET /stats/by-user    │ Per-user ticket breakdown                      │
  ├───────────────────────┼────────────────────────────────────────────────┤
  │ GET /stats/stale      │ Full details of stale high-priority tickets    │
  ├───────────────────────┼────────────────────────────────────────────────┤
  │ GET /stats/trends     │ Tickets created/closed per day (last 30 days)  │
  ├───────────────────────┼────────────────────────────────────────────────┤
  │ GET /stats/resolution │ Avg/min/max resolution time for closed tickets │
  └───────────────────────┴────────────────────────────────────────────────┘
