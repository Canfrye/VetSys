function DashboardListCard({
  title,
  items = [],
  renderItem,
  keyField = "id",
  onItemClick,
  emptyMessage = "Kayıt bulunmuyor.",
  actionLabel,
  onAction,
  style,
}) {
  return (
    <div className="dashboard-card" style={style}>
      <div className="dashboard-card-header">
        <h3>{title}</h3>

        {actionLabel && onAction && (
          <button
            type="button"
            className="dashboard-card-action"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="dashboard-empty">{emptyMessage}</p>
      ) : (
        items.map((item, index) => (
          <div
            key={item[keyField] ?? index}
            className="dashboard-item"
            style={onItemClick ? { cursor: "pointer" } : undefined}
            onClick={
              onItemClick ? () => onItemClick(item) : undefined
            }
          >
            {renderItem(item)}
          </div>
        ))
      )}
    </div>
  );
}

export default DashboardListCard;
