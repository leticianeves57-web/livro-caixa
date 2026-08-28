export default function ConfirmDialog({ message, onCancel, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
        <h3 className="display" style={{ marginBottom: 12 }}>Confirmar exclusão</h3>
        <p style={{ fontSize: 14, marginBottom: 20 }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onCancel}>Cancelar</button>
          <button className="btn-primary" style={{ flex: 1, background: "var(--bad)" }} onClick={onConfirm}>Excluir</button>
        </div>
      </div>
    </div>
  );
}
