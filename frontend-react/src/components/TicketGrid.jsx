import TicketCard from './TicketCard';

export default function TicketGrid({ tickets, loading, onEdit, onStatusChange, onDelete }) {
  if (loading) {
    return <div className="ticket-grid"><div className="loading-state">⏳ טוען...</div></div>;
  }
  if (!tickets.length) {
    return <div className="ticket-grid"><div className="empty-state">📭 לא נמצאו פניות</div></div>;
  }
  return (
    <div className="ticket-grid">
      {tickets.map(ticket => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          onEdit={onEdit}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
