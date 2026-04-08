export default function Toast({ visible, message, type }) {
  if (!visible) return null;
  return <div className={`toast ${type}`}>{message}</div>;
}
