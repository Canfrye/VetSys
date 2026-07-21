import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

function formatUptime(seconds) {
  if (seconds == null) return "—";
  const s = Number(seconds) || 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}sa ${m}dk`;
  if (m > 0) return `${m}dk ${sec}sn`;
  return `${sec} sn`;
}

/**
 * Settings → Sistem kartı (Electron masaüstü durumu).
 * Web'de bilgilendirici özet gösterir.
 */
export default function SystemStatusCard() {
  const [status, setStatus] = useState(null);
  const isElectron = Boolean(window.vetsysDesktop?.isElectron);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (!window.vetsysDesktop?.getSystemStatus) {
        if (!cancelled) {
          setStatus({
            isDev: true,
            manageBackend: false,
            backend: { running: false, healthy: false },
          });
        }
        return;
      }
      const data = await window.vetsysDesktop.getSystemStatus();
      if (!cancelled) setStatus(data);
    }

    const id = setInterval(tick, 5000);
    queueMicrotask(() => {
      tick();
    });

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!window.vetsysDesktop?.getSystemStatus) return;
    const data = await window.vetsysDesktop.getSystemStatus();
    setStatus(data);
  }, []);

  const backend = status?.backend || {};
  const healthy = Boolean(backend.healthy);
  const running = Boolean(backend.running);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Sistem
        </Typography>
        <Typography color="text.secondary" mb={2}>
          Masaüstü servis durumu, API adresi ve günlükler.
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {!isElectron && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            Bu kart Electron masaüstü uygulamasında tam durum bilgisi gösterir.
            Tarayıcı geliştirme modunda backend ayrı yönetilir.
          </Typography>
        )}

        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ minWidth: 140 }}>
              Backend durumu
            </Typography>
            <Chip
              size="small"
              label={
                !isElectron
                  ? "Web / harici"
                  : healthy
                    ? "Çalışıyor"
                    : running
                      ? "Yanıt yok"
                      : status?.manageBackend
                        ? "Kapalı"
                        : "Geliştirme (otomatik değil)"
              }
              color={healthy ? "success" : running ? "warning" : "default"}
            />
          </Stack>

          <Typography variant="body2">
            API adresi:{" "}
            <strong>{backend.apiBaseUrl || "http://127.0.0.1:4000/api"}</strong>
          </Typography>
          <Typography variant="body2">
            Backend / uygulama sürümü:{" "}
            <strong>{status?.version || "—"}</strong>
          </Typography>
          <Typography variant="body2">
            Çalışma süresi:{" "}
            <strong>{formatUptime(backend.uptimeSeconds)}</strong>
          </Typography>

          {status?.logsDir && (
            <Box mt={1}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Günlük klasörü: {status.logsDir}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => window.vetsysDesktop?.openLogs?.()}
              >
                Log klasörünü aç
              </Button>
              <Button
                variant="text"
                size="small"
                sx={{ ml: 1 }}
                onClick={refresh}
              >
                Yenile
              </Button>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
