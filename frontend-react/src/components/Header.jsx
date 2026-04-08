export default function Header({ onNewTicket }) {
  return (
    <header className="header">
      <div className="header-inner">
        <h1 className="logo">🎫 מערכת פניות</h1>
        <button className="btn btn-primary" onClick={onNewTicket}>+ פנייה חדשה</button>
      </div>
    </header>
  );
}
