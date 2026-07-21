/**
 * Electron ilk çalıştırma ekranı.
 * Web / tarayıcı modunda hiç render edilmez.
 */

import { useEffect, useState } from "react";
import { Box, LinearProgress, Stack, Typography } from "@mui/material";

const STEPS = [
  "VetSys klasörü oluşturuluyor...",
  "Yapılandırma hazırlanıyor...",
  "Kurulum tamamlandı.",
];

function isDesktopBridgeAvailable() {
  return typeof window !== "undefined" && window.vetsysDesktop?.isElectron;
}

/**
 * İlk kurulum akışını yönetir. Bittiğinde children render edilir.
 * Mevcut sayfalara dokunmaz.
 */
export default function DesktopBootstrap({ children }) {
  const [ready, setReady] = useState(!isDesktopBridgeAvailable());
  const [stepIndex, setStepIndex] = useState(0);
  const [statusText, setStatusText] = useState(STEPS[0]);

  useEffect(() => {
    if (!isDesktopBridgeAvailable()) {
      return undefined;
    }

    let cancelled = false;

    async function run() {
      const desktop = window.vetsysDesktop;
      const bootstrap = await desktop.getBootstrap();

      if (cancelled) {
        return;
      }

      if (!bootstrap?.isFirstRun) {
        // Tek seferlik localStorage yedeği: boş anahtarlara yaz, mevcutu silme
        await applyLocalStorageBackupOnce(desktop);
        setReady(true);
        return;
      }

      const prep = await desktop.prepareFirstRun();
      const messages = prep?.messages?.length ? prep.messages : STEPS;

      for (let i = 0; i < messages.length; i += 1) {
        if (cancelled) {
          return;
        }
        setStepIndex(i);
        setStatusText(messages[i]);
        await wait(650);
      }

      await applyLocalStorageBackupOnce(desktop);
      await desktop.completeFirstRun();

      if (!cancelled) {
        setReady(true);
      }
    }

    run().catch(() => {
      if (!cancelled) {
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (ready) {
    return children;
  }

  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 3,
      }}
    >
      <Stack spacing={2} sx={{ width: "100%", maxWidth: 420 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          VetSys
        </Typography>
        <Typography color="text.secondary">{statusText}</Typography>
        <LinearProgress variant="determinate" value={progress} />
      </Stack>
    </Box>
  );
}

async function applyLocalStorageBackupOnce(desktop) {
  const MIGRATED_FLAG = "vetsys_desktop_ls_migrated";

  if (localStorage.getItem(MIGRATED_FLAG) === "1") {
    // Güncel localStorage'ı userData yedeğine yaz (silmeden)
    await persistCurrentLocalStorage(desktop);
    return;
  }

  const backup = await desktop.getLocalBackup();
  if (backup && typeof backup === "object") {
    for (const [key, value] of Object.entries(backup)) {
      if (key === MIGRATED_FLAG) {
        continue;
      }
      const existing = localStorage.getItem(key);
      if (existing == null || existing === "" || existing === "[]") {
        localStorage.setItem(
          key,
          typeof value === "string" ? value : JSON.stringify(value)
        );
      }
    }
  }

  localStorage.setItem(MIGRATED_FLAG, "1");
  await persistCurrentLocalStorage(desktop);
}

async function persistCurrentLocalStorage(desktop) {
  const payload = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key) {
      payload[key] = localStorage.getItem(key);
    }
  }
  await desktop.saveLocalBackup(payload);
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
