import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EmailIcon from "@mui/icons-material/Email";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import {
  buildMailtoUrl,
  buildReminderMessage,
  buildWhatsAppUrl,
} from "../../utils/reminderMessages";
import {
  REMIND_AGAIN_DAYS,
  REMINDER_STATUS,
  REMINDER_STATUS_OPTIONS,
  markReminderSent,
  saveReminderStatus,
} from "../../utils/reminderStatus";

async function copyText(text) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const area = document.createElement("textarea");
  area.value = text;
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
}

function ReminderRow({ item, settings, onUpdated, notify }) {
  const message = buildReminderMessage(item, settings);
  const whatsappUrl = buildWhatsAppUrl(item.phone, message.body);
  const mailtoUrl = buildMailtoUrl(item.email, message.subject, message.body);
  const hasPhone = Boolean(whatsappUrl);
  const hasEmail = Boolean(item.email);

  async function handleStatusChange(status) {
    await saveReminderStatus(item.id, { status });
    notify?.(`Durum: ${status}`);
    onUpdated?.();
  }

  async function handleWhatsApp() {
    if (!whatsappUrl) return;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    await markReminderSent(item.id, { channel: "whatsapp" });
    notify?.("WhatsApp taslağı açıldı.");
    onUpdated?.();
  }

  async function handleCopySms() {
    await copyText(message.sms);
    await markReminderSent(item.id, { channel: "sms" });
    notify?.("SMS metni panoya kopyalandı.");
    onUpdated?.();
  }

  async function handleCopyEmail() {
    await copyText(`${message.subject}\n\n${message.body}`);
    notify?.("E-posta metni panoya kopyalandı.");
  }

  async function handleOpenMail() {
    if (!mailtoUrl) {
      await handleCopyEmail();
      return;
    }
    window.location.href = mailtoUrl;
    await markReminderSent(item.id, { channel: "email" });
    notify?.("E-posta taslağı açıldı.");
    onUpdated?.();
  }

  async function handleRemindAgain(days) {
    await markReminderSent(item.id, {
      channel: item.reminderChannel || "",
      remindAgainDays: days,
    });
    notify?.(`${days} gün sonra yeniden hatırlatılacak.`);
    onUpdated?.();
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 1.5,
        alignItems: { md: "center" },
        justifyContent: "space-between",
        py: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip size="small" label={item.kindLabel} color="primary" variant="outlined" />
          {item.daysUntil < 0 && (
            <Chip size="small" label="Gecikmiş" color="error" />
          )}
          {item.needsReRemind && (
            <Chip size="small" label="Yeniden hatırlat" color="warning" />
          )}
          <Typography fontWeight={700} noWrap>
            {item.animalName}
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {item.ownerName} · {item.title}
          {item.date ? ` · ${item.date}` : ""}
          {item.time ? ` ${item.time}` : ""}
          {item.veterinarian ? ` · ${item.veterinarian}` : ""}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          Tel: {item.phone || "Yok"}
          {item.email ? ` · ${item.email}` : ""}
        </Typography>
      </Box>

      <Stack spacing={1} alignItems={{ xs: "stretch", md: "flex-end" }}>
        <TextField
          select
          size="small"
          label="Durum"
          value={item.reminderStatus || REMINDER_STATUS.NOT_SENT}
          onChange={(e) => handleStatusChange(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          {REMINDER_STATUS_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <ButtonGroup size="small" variant="outlined">
          <Tooltip title={hasPhone ? "WhatsApp taslağı aç" : "Telefon yok"}>
            <span>
              <Button
                startIcon={<WhatsAppIcon />}
                disabled={!hasPhone}
                onClick={handleWhatsApp}
                color="success"
              >
                WhatsApp
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="SMS metnini kopyala">
            <Button startIcon={<ContentCopyIcon />} onClick={handleCopySms}>
              SMS
            </Button>
          </Tooltip>

          <Tooltip title="E-posta metnini kopyala">
            <Button startIcon={<ContentCopyIcon />} onClick={handleCopyEmail}>
              Mail Kopyala
            </Button>
          </Tooltip>

          <Tooltip title={hasEmail ? "mailto ile aç" : "E-posta yok — metin kopyalanır"}>
            <Button startIcon={hasEmail ? <EmailIcon /> : <OpenInNewIcon />} onClick={handleOpenMail}>
              Maili Aç
            </Button>
          </Tooltip>
        </ButtonGroup>

        {item.reminderStatus === REMINDER_STATUS.SENT && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
              Tekrar hatırlat:
            </Typography>
            {REMIND_AGAIN_DAYS.map((days) => (
              <Button
                key={days}
                size="small"
                variant="text"
                onClick={() => handleRemindAgain(days)}
              >
                {days} gün
              </Button>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

export default ReminderRow;
