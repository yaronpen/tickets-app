export default function StatsStrip({ stats }) {
  return (
    <section className="stats-strip">
      <div className="stat-card">
        <span className="stat-num">{stats.total}</span>
        <span className="stat-label">סה&quot;כ פניות</span>
      </div>
      <div className="stat-card open">
        <span className="stat-num">{stats.open}</span>
        <span className="stat-label">פתוחות</span>
      </div>
      <div className="stat-card progress">
        <span className="stat-num">{stats.in_progress}</span>
        <span className="stat-label">בטיפול</span>
      </div>
      <div className="stat-card closed">
        <span className="stat-num">{stats.closed}</span>
        <span className="stat-label">סגורות</span>
      </div>
      <div className="stat-card high">
        <span className="stat-num">{stats.high}</span>
        <span className="stat-label">עדיפות גבוהה</span>
      </div>
    </section>
  );
}
