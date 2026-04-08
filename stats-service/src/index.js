import express    from 'express';
import cors       from 'cors';
import { poolConnect } from './db.js';
import statsRouter     from './routes/stats.js';

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await poolConnect;
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ── Stats routes ───────────────────────────────────────────────────────────────
app.use('/stats', statsRouter);

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Error handler ──────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Stats service running on port ${PORT}`);
});
