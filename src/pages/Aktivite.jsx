import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

import PageLoading from "../components/PageLoading";
import EmptyState from "../components/EmptyState";

import { useAuth } from "../hooks/useAuth";
import { useNotification } from "../hooks/useNotification";
import { getSettings } from "../services/settingsService";
import {
  collectAuditFilterOptions,
  filterAuditLogs,
  getVisibleAuditLogs,
} from "../services/auditLogService";
import { generateAuditLogPdf } from "../utils/auditPdf";

import "../styles/customer.css";

const PERIOD_FILTERS = [
  { value: "all", label: "Tüm tarihler" },
  { value: "today", label: "Bugün" },
  { value: "week", label: "Bu hafta" },
  { value: "month", label: "Bu ay" },
];

function Aktivite() {
  const { user } = useAuth();
  const { notify } = useNotification();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState(null);

  const [period, setPeriod] = useState("all");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("");
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);

      const [visibleLogs, settingsData] = await Promise.all([
        getVisibleAuditLogs(user),
        getSettings(),
      ]);

      if (cancelled) return;

      setLogs(visibleLogs);
      setSettings(settingsData);
      setLoading(false);
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const filters = useMemo(
    () => ({ period, userId, role, module, action, search }),
    [period, userId, role, module, action, search]
  );

  const filteredLogs = useMemo(
    () => filterAuditLogs(logs, filters),
    [logs, filters]
  );

  const filterOptions = useMemo(
    () => collectAuditFilterOptions(logs),
    [logs]
  );

  function handlePdf() {
    generateAuditLogPdf(filteredLogs, settings || {});
    notify("Aktivite geçmişi PDF indirildi.");
  }

  if (loading) {
    return <PageLoading message="Aktivite geçmişi yükleniyor..." />;
  }

  return (
    <div className="customer-page">
      <div className="customer-header">
        <div>
          <Typography variant="h4" fontWeight="bold">
            Aktivite Geçmişi
          </Typography>
          <Typography color="text.secondary">
            Sistemde yapılan kritik işlemlerin denetim kaydı
          </Typography>
        </div>

        <Button
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          onClick={handlePdf}
          disabled={filteredLogs.length === 0}
        >
          PDF İndir
        </Button>
      </div>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            select
            fullWidth
            size="small"
            label="Tarih"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {PERIOD_FILTERS.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <TextField
            select
            fullWidth
            size="small"
            label="Kullanıcı"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <MenuItem value="">Tümü</MenuItem>
            {filterOptions.users.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <TextField
            select
            fullWidth
            size="small"
            label="Rol"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <MenuItem value="">Tümü</MenuItem>
            {filterOptions.roles.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <TextField
            select
            fullWidth
            size="small"
            label="Modül"
            value={module}
            onChange={(e) => setModule(e.target.value)}
          >
            <MenuItem value="">Tümü</MenuItem>
            {filterOptions.modules.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <TextField
            select
            fullWidth
            size="small"
            label="İşlem"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <MenuItem value="">Tümü</MenuItem>
            {filterOptions.actions.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            size="small"
            label="Ara"
            placeholder="REC-, FAT-, MAK-..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Grid>
      </Grid>

      {filteredLogs.length === 0 ? (
        <EmptyState message="Filtrelere uygun aktivite bulunamadı." />
      ) : (
        <Box
          sx={{
            overflowX: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: 2,
            bgcolor: "#fff",
          }}
        >
          <table className="customer-table" style={{ minWidth: 960 }}>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Saat</th>
                <th>Kullanıcı</th>
                <th>Rol</th>
                <th>İşlem</th>
                <th>Modül</th>
                <th>Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.date || "-"}</td>
                  <td>{log.time || "-"}</td>
                  <td>{log.userName || "-"}</td>
                  <td>{log.userRole || "-"}</td>
                  <td>{log.action || "-"}</td>
                  <td>{log.module || "-"}</td>
                  <td title={log.description}>{log.description || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}
    </div>
  );
}

export default Aktivite;
