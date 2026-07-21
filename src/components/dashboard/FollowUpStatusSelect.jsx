import { MenuItem, Select } from "@mui/material";
import { APPOINTMENT_STATUSES } from "../../utils/appointmentStatus";
import { FOLLOW_UP_KIND } from "../../utils/followUpTracking";

const VACCINE_CONTROL_STATUSES = ["Bekliyor", "Tamamlandı"];

/**
 * Satır içi durum seçici — tıklama hayvan detayına gitmez.
 */
function FollowUpStatusSelect({ item, onChange, disabled = false }) {
  const options =
    item.kind === FOLLOW_UP_KIND.APPOINTMENT
      ? APPOINTMENT_STATUSES
      : VACCINE_CONTROL_STATUSES;

  const value =
    item.kind === FOLLOW_UP_KIND.APPOINTMENT
      ? item.status || "Bekliyor"
      : item.status === "Gecikmiş"
        ? "Bekliyor"
        : item.status || "Bekliyor";

  return (
    <Select
      size="small"
      value={options.includes(value) ? value : options[0]}
      disabled={disabled}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onChange={(e) => {
        e.stopPropagation();
        onChange(item, e.target.value);
      }}
      sx={{
        minWidth: 128,
        fontSize: 13,
        bgcolor: "background.paper",
      }}
    >
      {options.map((status) => (
        <MenuItem key={status} value={status}>
          {status}
        </MenuItem>
      ))}
    </Select>
  );
}

export default FollowUpStatusSelect;
