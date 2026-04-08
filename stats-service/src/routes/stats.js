import { Router } from 'express';
import { pool, poolConnect } from '../db.js';

const router = Router();

async function query(sql) {
  await poolConnect;
  const result = await pool.request().query(sql);
  return result.recordset;
}

// ── GET /stats/overview ────────────────────────────────────────────────────────
// Counts by status, by priority, unassigned, and stale high-priority
router.get('/overview', async (req, res) => {
  const [byStatus, byPriority, unassigned, stale] = await Promise.all([
    query(`
      SELECT status, COUNT(*) AS count
      FROM tickets
      GROUP BY status
    `),
    query(`
      SELECT priority, COUNT(*) AS count
      FROM tickets
      GROUP BY priority
    `),
    query(`
      SELECT COUNT(*) AS count
      FROM tickets
      WHERE assigned_user_id IS NULL
    `),
    query(`
      SELECT COUNT(*) AS count
      FROM tickets
      WHERE priority  = 'high'
        AND status   != 'open'
        AND updated_at < DATEADD(HOUR, -48, GETUTCDATE())
    `),
  ]);

  const total = byStatus.reduce((sum, r) => sum + r.count, 0);

  res.json({
    total,
    by_status: Object.fromEntries(byStatus.map(r => [r.status, r.count])),
    by_priority: Object.fromEntries(byPriority.map(r => [r.priority, r.count])),
    unassigned: unassigned[0].count,
    stale_high_priority: stale[0].count,
  });
});

// ── GET /stats/by-user ─────────────────────────────────────────────────────────
// Ticket breakdown per assigned user
router.get('/by-user', async (req, res) => {
  const rows = await query(`
    SELECT
      u.id,
      u.name,
      u.email,
      COUNT(t.id)                                          AS total,
      SUM(CASE WHEN t.status = 'open'        THEN 1 ELSE 0 END) AS [open],
      SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
      SUM(CASE WHEN t.status = 'closed'      THEN 1 ELSE 0 END) AS closed,
      SUM(CASE WHEN t.priority = 'high'      THEN 1 ELSE 0 END) AS high_priority
    FROM users u
    LEFT JOIN tickets t ON t.assigned_user_id = u.id
    GROUP BY u.id, u.name, u.email
    ORDER BY total DESC
  `);

  res.json(rows);
});

// ── GET /stats/stale ───────────────────────────────────────────────────────────
// Full details of stale high-priority tickets
router.get('/stale', async (req, res) => {
  const rows = await query(`
    SELECT
      t.id,
      t.title,
      t.status,
      t.priority,
      t.created_at,
      t.updated_at,
      u.name  AS assigned_user_name,
      u.email AS assigned_user_email,
      DATEDIFF(HOUR, t.updated_at, GETUTCDATE()) AS hours_since_update
    FROM tickets t
    LEFT JOIN users u ON u.id = t.assigned_user_id
    WHERE t.priority  = 'high'
      AND t.status   != 'open'
      AND t.updated_at < DATEADD(HOUR, -48, GETUTCDATE())
    ORDER BY t.updated_at ASC
  `);

  res.json(rows);
});

// ── GET /stats/trends ──────────────────────────────────────────────────────────
// Tickets created per day for the last 30 days
router.get('/trends', async (req, res) => {
  const rows = await query(`
    SELECT
      CAST(created_at AS DATE)  AS date,
      COUNT(*)                  AS created,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed
    FROM tickets
    WHERE created_at >= DATEADD(DAY, -30, GETUTCDATE())
    GROUP BY CAST(created_at AS DATE)
    ORDER BY date ASC
  `);

  res.json(rows);
});

// ── GET /stats/resolution ──────────────────────────────────────────────────────
// Average time (hours) from creation to last update for closed tickets
router.get('/resolution', async (req, res) => {
  const rows = await query(`
    SELECT
      AVG(CAST(DATEDIFF(MINUTE, created_at, updated_at) AS FLOAT)) / 60 AS avg_hours,
      MIN(DATEDIFF(MINUTE, created_at, updated_at))                  / 60 AS min_hours,
      MAX(DATEDIFF(MINUTE, created_at, updated_at))                  / 60 AS max_hours,
      COUNT(*)                                                             AS total_closed
    FROM tickets
    WHERE status = 'closed'
  `);

  const stats = rows[0];
  res.json({
    avg_resolution_hours: stats.avg_hours ? parseFloat(stats.avg_hours.toFixed(2)) : null,
    min_resolution_hours: stats.min_hours,
    max_resolution_hours: stats.max_hours,
    total_closed:         stats.total_closed,
  });
});

export default router;
