export const APPOINTMENT_STATUSES = [
  "Bekliyor",
  "Geldi",
  "Tamamlandı",
  "İptal",
];

export function getAppointmentStatusColor(status) {
  switch (status) {
    case "Bekliyor":
      return "warning";
    case "Geldi":
      return "info";
    case "Tamamlandı":
      return "success";
    case "İptal":
      return "error";
    default:
      return "default";
  }
}
