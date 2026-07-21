import { Chip, Typography } from "@mui/material";
import DashboardListCard from "./DashboardListCard";
import FollowUpStatusSelect from "./FollowUpStatusSelect";

function FollowUpRow({ item, onStatusChange, statusUpdating }) {
  return (
    <>
      <span style={{ minWidth: 0, flex: 1 }}>
        <strong style={{ display: "block" }}>
          {item.animalName}
          {item.time ? ` · ${item.time}` : ""}
        </strong>
        <Typography
          component="span"
          variant="body2"
          color="text.secondary"
          sx={{ display: "block" }}
        >
          {item.ownerName} · {item.kindLabel}
          {item.title ? ` · ${item.title}` : ""}
        </Typography>
      </span>

      <span
        className="dashboard-item-badges"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {item.dueBadge && (
          <Chip
            label={item.dueBadge.label}
            color={item.dueBadge.color}
            size="small"
          />
        )}
        <FollowUpStatusSelect
          item={item}
          disabled={statusUpdating}
          onChange={onStatusChange}
        />
      </span>
    </>
  );
}

export function TodayFollowUpsCard({
  todayBoard,
  onItemClick,
  onStatusChange,
  statusUpdating,
}) {
  const sections = [
    {
      key: "appointments",
      title: "Bugünkü randevular",
      items: todayBoard.appointments,
      empty: "Bugün randevu yok.",
    },
    {
      key: "vaccines",
      title: "Bugün yapılacak aşılar",
      items: todayBoard.vaccines,
      empty: "Bugün aşı yok.",
    },
    {
      key: "overdueVaccines",
      title: "Gecikmiş aşılar",
      items: todayBoard.overdueVaccines,
      empty: "Gecikmiş aşı yok.",
    },
    {
      key: "controls",
      title: "Bugün yapılacak kontroller",
      items: todayBoard.controls,
      empty: "Bugün kontrol yok.",
    },
  ];

  return (
    <div className="dashboard-card" style={{ width: "100%" }}>
      <h3>Bugün Yapılması Gerekenler</h3>

      {sections.map((section) => (
        <div key={section.key} className="follow-up-section">
          <Typography
            variant="subtitle2"
            fontWeight={700}
            color="text.secondary"
            sx={{ mb: 1, mt: 1.5 }}
          >
            {section.title}
          </Typography>

          {section.items.length === 0 ? (
            <p className="dashboard-empty" style={{ paddingTop: 4 }}>
              {section.empty}
            </p>
          ) : (
            section.items.map((item) => (
              <div
                key={item.id}
                className="dashboard-item"
                style={{ cursor: item.animalId ? "pointer" : undefined }}
                onClick={() => item.animalId && onItemClick?.(item)}
              >
                <FollowUpRow
                  item={item}
                  onStatusChange={onStatusChange}
                  statusUpdating={statusUpdating}
                />
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
}

export function UpcomingFollowUpsCard({
  items,
  onItemClick,
  onStatusChange,
  statusUpdating,
}) {
  return (
    <DashboardListCard
      title="Önümüzdeki 7 Gün"
      items={items}
      emptyMessage="Önümüzdeki 7 günde işlem yok."
      style={{ width: "100%" }}
      onItemClick={(item) => item.animalId && onItemClick?.(item)}
      renderItem={(item) => (
        <>
          <span style={{ minWidth: 0, flex: 1 }}>
            <strong style={{ display: "block" }}>
              {item.animalName}
              {item.time ? ` · ${item.time}` : ""}
            </strong>
            <Typography
              component="span"
              variant="body2"
              color="text.secondary"
              sx={{ display: "block" }}
            >
              {item.ownerName} · {item.kindLabel} · {item.date}
              {item.title ? ` · ${item.title}` : ""}
            </Typography>
          </span>

          <span
            className="dashboard-item-badges"
            onClick={(e) => e.stopPropagation()}
          >
            <Chip
              label={
                item.daysUntil === 0
                  ? "Bugün"
                  : item.daysUntil === 1
                    ? "1 gün"
                    : `${item.daysUntil} gün`
              }
              color={item.dueBadge?.color || "default"}
              size="small"
            />
            <FollowUpStatusSelect
              item={item}
              disabled={statusUpdating}
              onChange={onStatusChange}
            />
          </span>
        </>
      )}
    />
  );
}

export function OverdueFollowUpsCard({
  items,
  onItemClick,
  onStatusChange,
  statusUpdating,
}) {
  if (!items.length) {
    return (
      <div
        className="dashboard-card follow-up-overdue"
        style={{ width: "100%" }}
      >
        <h3>Geciken İşlemler</h3>
        <p className="dashboard-empty">Geciken işlem yok.</p>
      </div>
    );
  }

  return (
    <div
      className="dashboard-card follow-up-overdue follow-up-overdue--alert"
      style={{ width: "100%" }}
    >
      <h3>Geciken İşlemler</h3>
      <Typography variant="body2" color="error" sx={{ mb: 1.5 }}>
        Bugünden eski ve henüz tamamlanmamış aşı / randevu kayıtları.
      </Typography>

      {items.map((item) => (
        <div
          key={item.id}
          className="dashboard-item follow-up-overdue-item"
          style={{ cursor: item.animalId ? "pointer" : undefined }}
          onClick={() => item.animalId && onItemClick?.(item)}
        >
          <FollowUpRow
            item={item}
            onStatusChange={onStatusChange}
            statusUpdating={statusUpdating}
          />
        </div>
      ))}
    </div>
  );
}
