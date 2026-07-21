import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

import PageLoading from "../components/PageLoading";
import EmptyState from "../components/EmptyState";
import ReminderRow from "../components/reminders/ReminderRow";

import { loadReminderCenterData } from "../services/reminderService";
import {
  collectVeterinarianOptions,
  filterReminderItems,
  FOLLOW_UP_KIND,
} from "../utils/reminderCenter";
import { REMINDER_STATUS } from "../utils/reminderStatus";
import { generateTodayRemindersPdf } from "../utils/reminderPdf";
import { useNotification } from "../hooks/useNotification";

import "../styles/customer.css";

const KIND_FILTERS = [
  { value: "all", label: "Tümü" },
  { value: FOLLOW_UP_KIND.VACCINE, label: "Sadece aşı" },
  { value: FOLLOW_UP_KIND.CONTROL, label: "Sadece kontrol" },
  { value: FOLLOW_UP_KIND.APPOINTMENT, label: "Sadece randevu" },
];

const PERIOD_FILTERS = [
  { value: "all", label: "Tüm tarihler" },
  { value: "today", label: "Bugün" },
  { value: "week", label: "Bu hafta" },
  { value: "overdue", label: "Gecikenler" },
];

const STATUS_FILTERS = [
  { value: "all", label: "Tüm durumlar" },
  { value: "unsent", label: "Gönderilmeyenler" },
  { value: REMINDER_STATUS.NOT_SENT, label: "Gönderilmedi" },
  { value: REMINDER_STATUS.SENT, label: "Gönderildi" },
  { value: REMINDER_STATUS.POSTPONED, label: "Ertelendi" },
];

function Reminders() {
  const { notify } = useNotification();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const [kind, setKind] = useState("all");
  const [period, setPeriod] = useState("all");
  const [status, setStatus] = useState("all");
  const [veterinarian, setVeterinarian] = useState("");
  const [search, setSearch] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      const next = await loadReminderCenterData();
      if (cancelled) return;
      setData(next);
      setLoading(false);
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  function reload() {
    setRefreshToken((token) => token + 1);
  }

  const filters = useMemo(
    () => ({ kind, period, status, veterinarian, search }),
    [kind, period, status, veterinarian, search]
  );

  const filteredSections = useMemo(() => {
    if (!data) return [];

    return data.sections
      .map((section) => ({
        ...section,
        items: filterReminderItems(section.items, filters),
      }))
      .filter((section) => section.items.length > 0);
  }, [data, filters]);

  const veterinarianOptions = useMemo(
    () => collectVeterinarianOptions(data?.all || []),
    [data]
  );

  const todayFiltered = useMemo(() => {
    if (!data) return [];
    return filterReminderItems(data.todayItems, {
      ...filters,
      period: "today",
    });
  }, [data, filters]);

  function handlePdf() {
    if (!data) return;
    generateTodayRemindersPdf(data.todayItems, data.settings);
    notify("Bugünkü hatırlatmalar PDF indirildi.");
  }

  if (loading || !data) {
    return <PageLoading message="Hatırlatmalar yükleniyor..." />;
  }

  return (
    <div className="customer-page">
      <div className="customer-header">
        <div>
          <h1>Hatırlatmalar</h1>
          <p>Aşı, kontrol ve randevu iletişim merkezi</p>
        </div>

        <Button
          variant="contained"
          startIcon={<PictureAsPdfIcon />}
          onClick={handlePdf}
        >
          Bugünkü Liste (PDF)
        </Button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <Card>
          <CardContent>
            <Typography color="text.secondary">Bugünkü</Typography>
            <Typography variant="h5" fontWeight={800}>
              {data.counts.today}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary">Yaklaşan</Typography>
            <Typography variant="h5" fontWeight={800}>
              {data.counts.upcoming}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary">Gönderilmeyen</Typography>
            <Typography variant="h5" fontWeight={800} color="warning.main">
              {data.counts.unsent}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary">Geciken</Typography>
            <Typography variant="h5" fontWeight={800} color="error.main">
              {data.counts.overdue}
            </Typography>
          </CardContent>
        </Card>
      </div>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Ara"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hayvan, müşteri, telefon, aşı..."
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            select
            fullWidth
            size="small"
            label="Tür"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            {KIND_FILTERS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            select
            fullWidth
            size="small"
            label="Dönem"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {PERIOD_FILTERS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            select
            fullWidth
            size="small"
            label="Durum"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_FILTERS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="Veteriner"
            value={veterinarian}
            onChange={(e) => setVeterinarian(e.target.value)}
          >
            <MenuItem value="">Tümü</MenuItem>
            {veterinarianOptions.map((vet) => (
              <MenuItem key={vet} value={vet}>
                {vet}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {filteredSections.length === 0 ? (
        <EmptyState message="Filtreye uygun hatırlatma yok." />
      ) : (
        filteredSections.map((section) => (
          <Card key={section.key} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={1}>
                {section.title}
                <Typography component="span" color="text.secondary" ml={1}>
                  ({section.items.length})
                </Typography>
              </Typography>

              {section.items.map((item) => (
                <ReminderRow
                  key={item.id}
                  item={item}
                  settings={data.settings}
                  notify={notify}
                  onUpdated={reload}
                />
              ))}
            </CardContent>
          </Card>
        ))
      )}

      {todayFiltered.length > 0 && (
        <Box mt={1}>
          <Typography variant="caption" color="text.secondary">
            Bugün (filtreli): {todayFiltered.length} kayıt
          </Typography>
        </Box>
      )}
    </div>
  );
}

export default Reminders;
